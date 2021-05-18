pragma solidity >=0.7.0;

import "./lib/IERC20.sol";
import "./lib/SafeMath.sol";

contract Spaghetti is IERC20 {

	uint256 constant TOTAL_SUPPLY = 2000000 * (10 ** decimals);
	string public constant name = "SpaghettiToken";
	string public constant symbol = "SPAG";
	uint8 public constant decimals = 18;

	mapping(address => uint256) balances;
	mapping(address => mapping(address => uint256)) allowed;

	using SafeMath for uint256;

	constructor() {
		balances[msg.sender] = TOTAL_SUPPLY;
	}
	
	function totalSupply() public override pure returns (uint256) {
		return TOTAL_SUPPLY;
	}

	function balanceOf(address tokenOwner) public override view returns (uint256) {
		return balances[tokenOwner];
	}

	// Get the number of tokens that the spender is allowed to transfer on behalf of the owner
	function allowance(address tokenOwner, address spender) public override view returns (uint256) {
		return allowed[tokenOwner][spender];
	}

	// Transfer funds from the message sender
	function transfer(address to, uint256 tokens) public override returns (bool) {
		uint256 senderBalance = balances[msg.sender];
		require(tokens <= senderBalance);
		balances[msg.sender] = senderBalance.sub(tokens);
		balances[to] = balances[to].add(tokens);
		emit Transfer(msg.sender, to, tokens);
		return true;
	}

	// Allow the spender to transfer on behalf of the message sender
	function approve(address spender, uint256 tokens) public override returns (bool) {
		allowed[msg.sender][spender] = tokens;
		emit Approval(msg.sender, spender, tokens);
		return true;
	}

	// Use the message sender as a proxy and send between two address
	function transferFrom(address from, address to, uint256 tokens) public override returns (bool) {
		uint256 ownerBalance = balances[from];
		uint256 spenderAllowed = allowed[from][msg.sender];
		require(spenderAllowed >= tokens);
		require(ownerBalance >= tokens);
		balances[from] = ownerBalance.sub(tokens);
		balances[to] = balances[to].add(tokens);
		allowed[from][msg.sender] = spenderAllowed.sub(tokens);
		emit Transfer(from, to, tokens);
		return true;
	}

}
