const add_pair_token1 = document.getElementById("add_pair_token1");
const add_pair_token2 = document.getElementById("add_pair_token2");
const pair_list = document.getElementById("pair_list");
const swap_token_1 = document.getElementById("swap_token_1");
const swap_token_2 = document.getElementById("swap_token_2");
const swap_amount_1 = document.getElementById("swap_amount_1");
const swap_amount_2 = document.getElementById("swap_amount_2");
const liquidity_token_1 = document.getElementById("liquidity_token_1");
const liquidity_token_2 = document.getElementById("liquidity_token_2");
const liquidity_amount_1 = document.getElementById("liquidity_amount_1");
const liquidity_amount_2 = document.getElementById("liquidity_amount_2");

var pairs = [];
var loaded = false;

const token_database = {
	"0x2aEEeCFfE21B7cC2E4004A36a930C4Ac58a2683a": {
		name: "SpaghettiToken",
		symbol: "SPAG",
		decimals: 18,
	},
	"0x1E7D76605DDC2197396697D3B7005Cb5a7eBa056" : {
		name: "Pennecoin",
		symbol: "PENNE",
		decimals: 18,
	},
};

async function loadWeb3() {
	if (window.ethereum) {
		await window.ethereum.send("eth_requestAccounts");
		window.web3 = new Web3(window.ethereum);
		return true;
	} else {
		return false;
	}
}

function contractJsonListener() {
	const contract_json = JSON.parse(this.responseText);
	contract_abi = contract_json.abi;
	contract_address = contract_json["networks"][5777]["address"];
}

function tokenJsonListener() {
	const contract_json = JSON.parse(this.responseText);
	token_contract_abi = contract_json.abi;
}

function pairJsonListener() {
	const contract_json = JSON.parse(this.responseText);
	pair_contract_abi = contract_json["abi"];
	pair_contract_bytecode = contract_json["bytecode"];
}

async function load() {
	var req2 = new XMLHttpRequest();
	req2.addEventListener("load", tokenJsonListener);
	req2.open("GET", "build/contracts/IERC20.json");
	await req2.send();

	var req3 = new XMLHttpRequest();
	req3.addEventListener("load", pairJsonListener);
	req3.open("GET", "build/contracts/Pair.json");
	await req3.send();

	var req = new XMLHttpRequest();
	req.addEventListener("load", contractJsonListener);
	req.open("GET", "build/contracts/Pastadex.json");
	await req.send();

    loaded = await loadWeb3();
    window.contract = await loadContract();
    updateStatus(loaded ? "Ready" : "Please install the metamask extension");
}

async function loadContract() {
    return await new window.web3.eth.Contract(contract_abi, contract_address);
}

function updateStatus(status) {
    const statusEl = document.getElementById('status');
    statusEl.innerHTML = status;
    console.log(status);
}

load();

async function getAccount() {
    console.log("Getting account");
	const accounts = await window.web3.eth.getAccounts();
	return accounts[0];
}

async function addPair() {
	const token1 = add_pair_token1.value;
	const token2 = add_pair_token2.value;
	if ((await window.contract.methods.hasPairOfTokens(token1, token2).call()) == 0x1) {
		const account = await getAccount();
		console.log("Adding pair (" + token1 + ", " + token2 + ")");
		console.log("Deploying new Pair contract");
		const result = await new window.web3.eth.Contract(pair_contract_abi).deploy({data: pair_contract_bytecode, arguments: [token1, token2]}).send({gas: "3000000", from: account});
		console.log("Deployed to address " + result.options.address);
		console.log("Adding pair");
		await window.contract.methods.addPair(result.options.address).send({from: account});
	} else {
		console.log("Token pair already exists");
	}
}

async function refreshPairList() {
	pair_list.innerHTML = "";
	var i = 0;
	var pair = await window.contract.methods.getPair(i).call();
	while (pair != 0x1) {
		const liquidity = await window.contract.methods.getLiquidity(pair).call();
		const pair_contract = await new window.web3.eth.Contract(pair_contract_abi, pair);
		const token1 = await pair_contract.methods.token1().call();
		const token2 = await pair_contract.methods.token2().call();
		const token1_contract = await new window.web3.eth.Contract(token_contract_abi, token1);
		const token2_contract = await new window.web3.eth.Contract(token_contract_abi, token2);

		const token1_name = token_database[token1].name;
		const token1_symbol = token_database[token1].symbol;
		const token2_name = token_database[token2].name;
		const token2_symbol = token_database[token2].symbol;
		console.log(pair + ", " + token1_name + " (" + token1_symbol + ") : " + token2_name + " (" + token2_symbol + ") = " + liquidity);

		const ratio = window.web3.utils.toBN(await window.contract.methods.getRatio(pair).call()) / 2**124;

		const list_item = document.createElement("LI");
		const item_content = document.createTextNode(token1_symbol + " - " + token2_symbol + ": " + ratio);
		list_item.appendChild(item_content);
		pair_list.appendChild(list_item);

		const dropdown_item = document.createElement("OPTION");
		dropdown_item.value = token1;
		const dropdown_item_content = document.createTextNode(token1_symbol);
		dropdown_item.appendChild(dropdown_item_content);
		liquidity_token_1.appendChild(dropdown_item);
		swap_token_1.appendChild(dropdown_item.cloneNode(true));

		const dropdown_item2 = document.createElement("OPTION");
		dropdown_item2.value = token2;
		const dropdown_item_content2 = document.createTextNode(token2_symbol);
		dropdown_item2.appendChild(dropdown_item_content2);
		liquidity_token_2.appendChild(dropdown_item2);
		swap_token_2.appendChild(dropdown_item2.cloneNode(true));

		pairs.push({contract: pair_contract, address: pair, liquidity: liquidity, token1: token1, token2: token2});
		i++;
		pair = await window.contract.methods.getPair(i).call();
	}
}

async function getLiquidity() {
	const token1 = liquidity_token_1.value;
	const token2 = liquidity_token_2.value;
	const pair = await window.contract.methods.getPairForTokens(token1, token2).call();
	if (pair == 0x1) {
		console.log("No such pair");
		return;
	}

	const liquidity = await window.contract.methods.getLiquidityFor(pair, await getAccount()).call();
	const decimals1 = window.web3.utils.toBN(10).pow(window.web3.utils.toBN(token_database[token1].decimals));
	liquidity_amount_1.value = window.web3.utils.toBN(liquidity[0]).div(decimals1);
	const decimals2 = window.web3.utils.toBN(10).pow(window.web3.utils.toBN(token_database[token2].decimals));
	liquidity_amount_2.value = window.web3.utils.toBN(liquidity[1]).div(decimals2);
}

async function addLiquidity() {
	const token1 = liquidity_token_1.value;
	const token2 = liquidity_token_2.value;
	const pair = await window.contract.methods.getPairForTokens(token1, token2).call();
	if (pair == 0x1) {
		console.log("No such pair");
		return;
	}

	// TODO Make sure the user hasn't entered too many decimal places

	const decimals1 = window.web3.utils.toBN(10).pow(window.web3.utils.toBN(token_database[token1].decimals));
	const amount1 = window.web3.utils.toBN(liquidity_amount_1.value).mul(decimals1);
	const decimals2 = window.web3.utils.toBN(10).pow(window.web3.utils.toBN(token_database[token2].decimals));
	const amount2 = window.web3.utils.toBN(liquidity_amount_2.value).mul(decimals2);

	const token1_contract = await new window.web3.eth.Contract(token_contract_abi, token1);
	const token2_contract = await new window.web3.eth.Contract(token_contract_abi, token2);

	const account = await getAccount();
	if ((await token1_contract.methods.allowance(account, contract_address).call()) < amount1) {
		console.log("Approving token1");
		await token1_contract.methods.approve(contract_address, amount1).send({from: account});
	}
	if ((await token2_contract.methods.allowance(account, contract_address).call()) < amount2) {
		console.log("Approving token2");
		await token2_contract.methods.approve(contract_address, amount2).send({from: account});
	}
	console.log("Adding liquidity (" + amount1 + ", " + amount2 + ") for " + pair);
	await window.contract.methods.addLiquidity(pair, amount1, amount2).send({from: account});
}

var contract_address;
var contract_abi;
var pair_contract_abi;
var pair_contract_bytecode;
var token_contract_abi;
