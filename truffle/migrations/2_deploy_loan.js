var Loan = artifacts.require("Loan");

module.exports = function (deployer) {
  // Hard-coding borrower address, cUSD token, and loan amount for now
  deployer.deploy(Loan, '0x914c756d7ed05333Ce72fb7049747f2c0b28A326', '0x10A736A7b223f1FE1050264249d1aBb975741E75', 100);
};