// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0;

import "./lib/IERC20.sol";
import "./Pair.sol";

contract Pastadex {

	address contractOwner;

	mapping(address => address[]) liquidity_providers;
	mapping(address => mapping(address => uint128[2])) liquidity_pool;
	mapping(address => uint128[2]) liquidity_total;
	mapping(address => address) tokenPairs;

	address constant LIST_HEADER = address(1);
	address constant LIST_NULL = address(0);
	uint128 constant FEE_DENOMINATOR = 1000;

	constructor() {
		contractOwner = msg.sender;
		tokenPairs[LIST_HEADER] = LIST_HEADER;
	}

	function addLiquidity(address pairAddr, uint128 numToken1, uint128 numToken2) public {
		require(pairAddr != address(0));
		require(hasPair(pairAddr));
		require(getRatio(pairAddr) == 0 || getRatio(numToken1, numToken2) == getRatio(pairAddr));

		Pair pair = Pair(pairAddr);
		IERC20 token1 = IERC20(pair.token1());
		IERC20 token2 = IERC20(pair.token2());

		require(token1.allowance(msg.sender, address(this)) >= numToken1);
		require(token2.allowance(msg.sender, address(this)) >= numToken2);
		require(token1.balanceOf(msg.sender) >= numToken1);
		require(token2.balanceOf(msg.sender) >= numToken2);

		// Add the sender to the list of providers if they aren't already in it
		uint128[2] storage current_liquidity = liquidity_pool[pairAddr][msg.sender];
		if (current_liquidity[0] == 0 && current_liquidity[1] == 0) {
			liquidity_providers[pairAddr].push(msg.sender);
		}

		// Add their liquidity
		current_liquidity[0] = current_liquidity[0] + numToken1;
		current_liquidity[1] = current_liquidity[1] + numToken2;
		liquidity_total[pairAddr][0] = liquidity_total[pairAddr][0] + numToken1;
		liquidity_total[pairAddr][1] = liquidity_total[pairAddr][1] + numToken2;

		// Transfer the tokens from their account to this contract
		token1.transferFrom(msg.sender, address(this), numToken1);
		token2.transferFrom(msg.sender, address(this), numToken2);
	}

	function swap(address pairAddr, uint128 numTokenFrom, uint128 numTokenTo, bool inOrder) public {
		require(pairAddr != address(0), "INVALID_PAIR");
		require(hasPair(pairAddr), "NO_SUCH_PAIR");
		require(getRatio(pairAddr) == getRatio(inOrder ? numTokenFrom : numTokenTo, inOrder ? numTokenTo : numTokenFrom), "INVALID_RATIO");

		Pair pair = Pair(pairAddr);
		IERC20 tokenFrom = inOrder ? IERC20(pair.token1()) : IERC20(pair.token2());
		IERC20 tokenTo = inOrder ? IERC20(pair.token2()) : IERC20(pair.token1());

		require(tokenFrom.allowance(msg.sender, address(this)) >= numTokenFrom, "INSUFFICIENT_ALLOWANCE");
		require(tokenFrom.balanceOf(msg.sender) >= numTokenFrom, "INSUFFICIENT_BALANCE");
		require(liquidity_total[pairAddr][1] > numTokenTo, "INSUFFICIENT_LIQUIDITY");

		uint8 idxTokenFrom = inOrder ? 0 : 1;
		uint8 idxTokenTo = inOrder ? 1 : 0;
		
		require(liquidity_total[pairAddr][idxTokenTo] > numTokenTo, "INSUFFICIENT_LIQUIDITY");

		uint128 fee = numTokenTo / FEE_DENOMINATOR;

		_distributeFee(pairAddr, idxTokenFrom, idxTokenTo, fee, numTokenFrom, numTokenTo);

		liquidity_total[pairAddr][idxTokenFrom] = liquidity_total[pairAddr][idxTokenFrom] + numTokenFrom;
		liquidity_total[pairAddr][idxTokenTo] = liquidity_total[pairAddr][idxTokenTo] - (numTokenTo - fee);
		tokenFrom.transferFrom(msg.sender, address(this), numTokenFrom);
		tokenTo.transfer(msg.sender, numTokenTo - fee);
	}

	function _distributeFee(address pairAddr, uint8 idxTokenFrom, uint8 idxTokenTo, uint128 fee, uint128 numTokenFrom, uint128 numTokenTo) internal {
		uint i = 0;
		uint128 feeRemaining = fee;
		while (i < liquidity_providers[pairAddr].length) {
			address provider = liquidity_providers[pairAddr][i];
			uint256 proportion = (uint256(liquidity_total[pairAddr][idxTokenTo]) << 128) / uint256(liquidity_pool[pairAddr][provider][idxTokenTo]);
			uint128 feeShare = uint128(((uint256(fee) << 128) * proportion) >> 128);
			uint128 tokenToShare = uint128(((uint256(numTokenTo) << 128) * proportion) >> 128);
			uint128 tokenFromShare = uint128(((uint256(numTokenFrom) << 128) * proportion) >> 128);

			liquidity_pool[pairAddr][provider][idxTokenTo] -= tokenToShare - feeShare;
			liquidity_pool[pairAddr][provider][idxTokenFrom] += tokenFromShare;

			feeRemaining -= feeShare;

			i++;
		}
		require(feeRemaining == 0, "FEE_CALC_ERROR");
	}

	function getRatio(address pairAddr) public view returns (uint256) {
		require(hasPair(pairAddr));
		return getRatio(liquidity_total[pairAddr][0], liquidity_total[pairAddr][1]);
	}

	function getRatio(uint128 numToken1, uint128 numToken2) public pure returns (uint256) {
		if (numToken2 == 0) return 0;
		// Encode the u124 into UQ128.128 format
		uint256 q_amount1 = uint256(numToken1) << 128;
		return q_amount1 / uint256(numToken2);
	}

	function getLiquidity(address pair) public view returns (uint128[2] memory) {
		return liquidity_total[pair];
	}

	function getLiquidityFor(address pair, address provider) public view returns (uint128[2] memory) {
		return liquidity_pool[pair][provider];
	}

	function hasPair(address addr) public view returns (bool) {
		return tokenPairs[addr] != LIST_NULL;
	}

	function getPairForTokens(address token1, address token2) public view returns (address) {
		address iterator = tokenPairs[LIST_HEADER];
		while (iterator != LIST_HEADER) {
			Pair pair = Pair(iterator);
			if ((pair.token1() == token1 && pair.token2() == token2) || (pair.token2() == token1 && pair.token1() == token2)) return iterator;
			iterator = tokenPairs[iterator];
		}
		return LIST_HEADER;
	}

	function addPair(address pairAddr) public {
		require(!hasPair(pairAddr));
		require(pairAddr != LIST_HEADER && pairAddr != LIST_NULL);

		Pair pair = Pair(pairAddr);

		// Make sure a pair of these tokens doesn't already exist
		bool existsAlready = false;
		address iterator = LIST_HEADER;

		while (tokenPairs[iterator] != LIST_HEADER) {
			Pair iteratorPair = Pair(iterator);
			if ((iteratorPair.token1() == pair.token1() && iteratorPair.token2() == pair.token2()) || (iteratorPair.token1() == pair.token2() && iteratorPair.token2() == pair.token1())) {
				existsAlready = true;
				break;
			}
			iterator = tokenPairs[iterator];
		}
		require(!existsAlready);

		// Add it into the sorted pair list
		address candidate = LIST_HEADER;
		while (true) {
			address next = tokenPairs[candidate];
			if ((candidate < pairAddr || candidate == LIST_HEADER) && (next > pairAddr || next == LIST_HEADER)) {
				tokenPairs[candidate] = pairAddr;
				tokenPairs[pairAddr] = next;
				break;
			}
			candidate = next;
		}
	}

	function getPair(uint i) public view returns (address) {
		address iterator = tokenPairs[LIST_HEADER];
		uint j = 0;
		while (j < i && iterator != LIST_HEADER) {
			iterator = tokenPairs[iterator];
			j = j + 1;
		}
		return iterator;
	}

}
