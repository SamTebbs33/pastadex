const Penne = artifacts.require("Penne");
const Spaghetti = artifacts.require("Spaghetti");
const Pair = artifacts.require("Pair");
const Pastadex = artifacts.require("Pastadex");

module.exports = async function(deployer) {
	await deployer.deploy(Pastadex);
	dex_instance = await Pastadex.deployed();
	
	await deployer.deploy(Penne);
	penne = await Penne.deployed();

	await deployer.deploy(Spaghetti);
	spaghetti = await Spaghetti.deployed();

	await deployer.deploy(Pair, penne.address, spaghetti.address);
	pair = await Pair.deployed();
	await dex_instance.addPair(pair.address);

};
