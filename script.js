const add_pair_token1 = document.getElementById("add_pair_token1");
const add_pair_token2 = document.getElementById("add_pair_token2");
const pair_list = document.getElementById("pair_list");

var pairs = [];
var loaded = false;

const token_database = {
	"0xB27e139927473f193f877D5360cbD9Ea9318861F": {
		name: "SpaghettiToken",
		symbol: "SPAG",
	},
	"0x90E93f59554000226FcFF75730bF681BBa4c5A64": {
		name: "Pennecoin",
		symbol: "PENNE",
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
		console.log(token1_name + " (" + token1_symbol + ") : " + token2_name + " (" + token2_symbol + ") = " + liquidity);

		const list_item = document.createElement("LI");
		const item_content = document.createTextNode(token1_symbol + ":" + token2_symbol + " = " + liquidity[0] + ", " + liquidity[1]);
		list_item.appendChild(item_content);
		pair_list.appendChild(list_item);

		pairs.push({contract: pair_contract, address: pair, liquidity: liquidity, token1: token1, token2: token2});
		i++;
		pair = await window.contract.methods.getPair(i).call();
	}
}

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
          "name": "",
          "type": "address"
        }
      ],
      "name": "tokenPairs",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
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
          "name": "pair",
          "type": "address"
        }
      ],
      "name": "getLiquidity",
      "outputs": [
        {
          "internalType": "uint256[2]",
          "name": "",
          "type": "uint256[2]"
        }
      ],
      "stateMutability": "view",
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
      "type": "function"
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
      "type": "function"
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
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "i",
          "type": "uint256"
        }
      ],
      "name": "getPair",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];
const contract_address = "0x4893f49a3739A80C6102b1939e73Fe4F44e5C427";

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

const token_contract_abi = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "tokenOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "tokens",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "tokens",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "tokenOwner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "tokenOwner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "allowance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokens",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokens",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokens",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
