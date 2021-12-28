const { default: Web3 } = require("web3");

const Token = artifacts.require("Token");
const Exchange = artifacts.require("Exchange");

module.exports = async function(deployer) {
  // An array of all the accts on Ganache
  const accounts = await web3.eth.getAccounts()
  
  await deployer.deploy(Token);

  // Constructor is a fcn that occurs during deploy to blockchain
  const feeAccount = accounts[0]
  const feePercent = 10
  await deployer.deploy(Exchange, feeAccount, feePercent)
};
