const Penne = artifacts.require("Penne");
const Spaghetti = artifacts.require("Spaghetti");

const redeploy_tokens = true;

module.exports = function(deployer) {
	if (redeploy_tokens) {
		deployer.deploy(Penne);
		deployer.deploy(Spaghetti);
	}
};
