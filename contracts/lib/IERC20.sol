// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0;

interface IERC20 {

	event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
	event Transfer(address indexed from, address indexed to, uint tokens);

	function totalSupply() external pure returns (uint256);

	function balanceOf(address tokenOwner) external view returns (uint);

	// Get the number of tokens that the spender is allowed to transfer on behalf of the owner
	function allowance(address tokenOwner, address spender) external view returns (uint);

	// Transfer funds from the message sender
	function transfer(address to, uint tokens) external returns (bool);

	// Allow the spender to transfer on behalf of the message sender
	function approve(address spender, uint tokens) external returns (bool);

	// Use the message sender as a proxy and send between two address
	function transferFrom(address from, address to, uint tokens) external returns (bool);
}
