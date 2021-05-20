var loaded = false;
const contract_abi = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "pairAddr",
          "type": "address"
        },
        {
          "internalType": "uint128",
          "name": "numToken1",
          "type": "uint128"
        },
        {
          "internalType": "uint128",
          "name": "numToken2",
          "type": "uint128"
        }
      ],
      "name": "addLiquidity",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "addr",
          "type": "address"
        }
      ],
      "name": "hasPair",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token1",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "token2",
          "type": "address"
        }
      ],
      "name": "hasPairOfTokens",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "pairAddr",
          "type": "address"
        }
      ],
      "name": "addPair",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
const contract_address = "0x22FbC4bB4FE56B1173Fe9d1c925a09A12eF368BA";

const pair_contract_abi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "t1",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "t2",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "token1",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    },
    {
      "inputs": [],
      "name": "token2",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function",
      "constant": true
    }
  ];
const pair_contract_bytecode = "0x608060405234801561001057600080fd5b506040516102b63803806102b6833981810160405281019061003291906100cf565b816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555080600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505050610154565b6000815190506100c98161013d565b92915050565b600080604083850312156100e257600080fd5b60006100f0858286016100ba565b9250506020610101858286016100ba565b9150509250929050565b60006101168261011d565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6101468161010b565b811461015157600080fd5b50565b610153806101636000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806325be124e1461003b578063d21220a714610059575b600080fd5b610043610077565b60405161005091906100d0565b60405180910390f35b61006161009d565b60405161006e91906100d0565b60405180910390f35b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6100ca816100eb565b82525050565b60006020820190506100e560008301846100c1565b92915050565b60006100f6826100fd565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff8216905091905056fea2646970667358221220ec763a54ee1434fd69ea9943d91f7c8f5515724b30c9d889c97b5aef9f7400d464736f6c63430008040033";

const add_pair_token1 = document.getElementById("add_pair_token1");
const add_pair_token2 = document.getElementById("add_pair_token2");

async function loadWeb3() {
    if (window.ethereum) {
	await window.ethereum.send("eth_requestAccounts");
	window.web3 = new Web3(window.ethereum);
	return true;
    } else {
	return false;
    }
}

async function load() {
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
	if (!(await window.contract.methods.hasPairOfTokens(token1, token2).call())) {
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

/*

async function getWebsite() {
    console.log("Getting website");
    const account = await getAccount();
    const site = JSON.stringify(await window.contract.methods.getWebsite(account).call());
    return site.substring(1, site.length - 1);
}

async function uiGoToWebsite() {
    var site = await getWebsite();
    window.open(site);
}

async function uiGetWebsite() {
    var site = await getWebsite();
    website_text.value = site;
}

async function uiSetWebsite() {
    const account = await getAccount();
    console.log("Setting website for account " + account + " to " + website_text.value);
    await window.contract.methods.setWebsite(website_text.value).send({from: account});
}
*/
