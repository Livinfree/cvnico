const SafeMathLibExt = artifacts.require("./SafeMathLibExt.sol");
const CrowdsaleTokenExt = artifacts.require("./CrowdsaleTokenExt.sol");
const FlatPricingExt = artifacts.require("./FlatPricingExt.sol");
const MintedTokenCappedCrowdsaleExt = artifacts.require("./MintedTokenCappedCrowdsaleExt.sol");
const NullFinalizeAgentExt = artifacts.require("./NullFinalizeAgentExt.sol");
const ReservedTokensFinalizeAgent = artifacts.require("./ReservedTokensFinalizeAgent.sol");
const Registry = artifacts.require("./Registry.sol");

const constants = require("../test/constants");
const utils = require("../test/utils");
const Web3 = require("web3");

let web3;
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
}

const tokenParams = [
	constants.token.name,
  	constants.token.ticker,
  	parseInt(constants.token.supply, 10),
  	parseInt(constants.token.decimals, 10),
  	constants.token.isMintable,
  	constants.token.globalmincap
];

const pricingStrategyParams = [
	web3.toWei(1/constants.pricingStrategy.rate, "ether"),
    constants.crowdsale.isUpdatable
];

const crowdsaleParams = [
	constants.crowdsale.start,
	constants.crowdsale.end,
	constants.crowdsale.minimumFundingGoal,
	constants.crowdsale.maximumSellableTokens,
	constants.crowdsale.isUpdatable,
	constants.crowdsale.isWhiteListed
];

let nullFinalizeAgentParams = [];
let reservedTokensFinalizeAgentParams = [];

module.exports = function(deployer, network, accounts) {
  	deployer.deploy(SafeMathLibExt).then(async () => {
	  	await deployer.link(SafeMathLibExt, CrowdsaleTokenExt);
  		await deployer.deploy(CrowdsaleTokenExt, ...tokenParams);
		await deployer.link(SafeMathLibExt, FlatPricingExt);
  		await deployer.deploy(FlatPricingExt, ...pricingStrategyParams);
  		crowdsaleParams.unshift(accounts[3]);
		crowdsaleParams.unshift(FlatPricingExt.address);
		crowdsaleParams.unshift(CrowdsaleTokenExt.address);
		crowdsaleParams.unshift("Test Crowdsale");

		await deployer.link(SafeMathLibExt, MintedTokenCappedCrowdsaleExt);
    	await deployer.deploy(MintedTokenCappedCrowdsaleExt, ...crowdsaleParams);

    	nullFinalizeAgentParams.push(MintedTokenCappedCrowdsaleExt.address);
    	reservedTokensFinalizeAgentParams.push(CrowdsaleTokenExt.address);
    	reservedTokensFinalizeAgentParams.push(MintedTokenCappedCrowdsaleExt.address);

    	await deployer.link(SafeMathLibExt, NullFinalizeAgentExt);
    	await deployer.deploy(NullFinalizeAgentExt, ...nullFinalizeAgentParams);
    	await deployer.link(SafeMathLibExt, ReservedTokensFinalizeAgent);
    	await deployer.deploy(ReservedTokensFinalizeAgent, ...reservedTokensFinalizeAgentParams);

        await deployer.deploy(Registry);

    	await FlatPricingExt.deployed().then(async (instance) => {
	    	instance.setLastCrowdsale(MintedTokenCappedCrowdsaleExt.address);
	    });

	    let crowdsaleTokenExt = await CrowdsaleTokenExt.deployed();

    	//todo: setReservedTokensListMultiple
    	//let addrs = [];
    	//addrs.push(constants.reservedTokens.addr);
    	//let inTokens = [];
    	//inTokens.push(constants.reservedTokens.reservedTokens);
    	//let inTokensPercentage = [];
    	//inTokensPercentage.push(constants.reservedTokens.reservedTokensInPercentage);
    	//instance.setReservedTokensListMultiple(addrs, inTokens, inTokensPercentage);
    	
    	await crowdsaleTokenExt.setReservedTokensList(
    		accounts[2], 
    		constants.reservedTokens.number, 
    		constants.reservedTokens.percentageUnit, 
    		constants.reservedTokens.percentageDecimals
    	);
    	await crowdsaleTokenExt.setReservedTokensList(
    		accounts[4], 
    		constants.reservedTokens2.number, 
    		constants.reservedTokens2.percentageUnit, 
    		constants.reservedTokens2.percentageDecimals
    	);

		let mintedTokenCappedCrowdsaleExt = await MintedTokenCappedCrowdsaleExt.deployed();

	    await mintedTokenCappedCrowdsaleExt.clearJoinedCrowdsales();

		//todo
	    /*await MintedTokenCappedCrowdsaleExt.deployed().then(async (instance) => {
	    	//instance.updateJoinedCrowdsalesMultiple(MintedTokenCappedCrowdsaleExt.address);
	    	await instance.clearJoinedCrowdsales();
	    	//await instance.updateJoinedCrowdsales(instance.address);
	    });*/

	    await mintedTokenCappedCrowdsaleExt.setLastCrowdsale(MintedTokenCappedCrowdsaleExt.address);

	    await crowdsaleTokenExt.setMintAgent(MintedTokenCappedCrowdsaleExt.address, true);

	    await crowdsaleTokenExt.setMintAgent(NullFinalizeAgentExt.address, true);

	    await crowdsaleTokenExt.setMintAgent(ReservedTokensFinalizeAgent.address, true);

	    await mintedTokenCappedCrowdsaleExt.setEarlyParticipantWhitelist(
    		accounts[2], 
    		constants.whiteListItem.status, 
    		constants.whiteListItem.minCap, 
    		constants.whiteListItem.maxCap
    	);
    	await mintedTokenCappedCrowdsaleExt.setEarlyParticipantWhitelist(
    		accounts[4], 
    		constants.whiteListItem.status, 
    		constants.whiteListItem.minCap, 
    		constants.whiteListItem.maxCap
    	);

	    await mintedTokenCappedCrowdsaleExt.setFinalizeAgent(ReservedTokensFinalizeAgent.address);

	    await crowdsaleTokenExt.setReleaseAgent(ReservedTokensFinalizeAgent.address);

	    await crowdsaleTokenExt.transferOwnership(ReservedTokensFinalizeAgent.address);
  	});
};
