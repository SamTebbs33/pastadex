// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0;

contract Pair {
	
	address public token1;
	address public token2;

	constructor(address t1, address t2) {
		token1 = t1;
		token2 = t2;
	}

}
