import React, { useEffect, useState } from 'react';
import { useContractKit } from '@celo-tools/use-contractkit';
import { ContractKitProvider } from '@celo-tools/use-contractkit';
import '@celo-tools/use-contractkit/lib/styles.css';
import loanJson from '../truffle/build/contracts/Loan.json'; // Manually linking ABI for now
import erc20Json from '../truffle/build/contracts/ERC20.json'; // Manually linking ABI for now

function App () {
  const { connect, network, getConnectedKit} = useContractKit();
  let [account, setAccount] = useState([]);
  let [loan, setLoan] = useState([]);
  const ERC20_DECIMALS = 18;
  const loanAddress = '0x6f42BfAe79aefA1f99553770ACd24A4A037039c1'; // Hard-coding local contract - eventually make this config
  const cusdAddress = '0x10A736A7b223f1FE1050264249d1aBb975741E75'; // Hard-coding cusd - eventually allow any token
  
  let kit;
  let loanContract;
  let cusdContract;

  // TODO figure out how to run this before the others
  // TODO figure out how to preserve these values through button clicks
  async function initLoad() {
    kit = await getConnectedKit();
    loanContract = new kit.web3.eth.Contract(loanJson.abi, loanAddress);
    cusdContract = new kit.web3.eth.Contract(erc20Json.abi, cusdAddress);
    const web3Accounts = await kit.web3.eth.getAccounts();
    kit.defaultAccount = web3Accounts[0];
    console.log(network);
  }

  async function getAccountSummary() {
    await initLoad();
    const totalBalance = await kit.getTotalBalance(kit.defaultAccount);
    account = {
      address: kit.defaultAccount,
      CELO: totalBalance.CELO.shiftedBy(-ERC20_DECIMALS).toFixed(2),
      cUSD: totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2),
      cEUR: totalBalance.cEUR.shiftedBy(-ERC20_DECIMALS).toFixed(2),
    };
    setAccount(account);
  }

  async function getContractSummary() {
    await initLoad();
    const amountRequested = await loanContract.methods.amountRequested().call();
    const amountRaised = await loanContract.methods.amountRaised().call();
    const amountLeftToFund = await loanContract.methods.amountLeftToFund().call();
    const amountRepaid = await loanContract.methods.amountRepaid().call();
    const amountLenderHasWithdraw = await loanContract.methods.amountLenderHasWithdraw().call();
    loan = {
      amountRequested,
      amountRaised,
      amountLeftToFund,
      amountRepaid,
      amountLenderHasWithdraw,
    };
    setLoan(loan);
  }

  // TODO figure out a better method to keep around kit and contract info without doing initLoad each time

  async function approve() {
    await initLoad();
    // Hard-coding to 1 million for now
    const txObject = await cusdContract.methods.approve(loanAddress, 1000000); 
    await kit.sendTransactionObject(txObject, { from: kit.defaultAccount })
  }
  async function lenderLend() {
    await initLoad();
    // Hard-coding to lend 4 for now
    const txObject = await loanContract.methods.lend(100); 
    await kit.sendTransactionObject(txObject, { from: kit.defaultAccount })
  }

  async function borrowerWithdraw() {
    await initLoad();
    const txObject = await loanContract.methods.borrowerWithdraw(); 
    await kit.sendTransactionObject(txObject, { from: kit.defaultAccount })
  }

  async function borrowerRepay() {
    await initLoad();
    // Hard-coding to repay 2 for now
    const txObject = await loanContract.methods.borrowerRepay(50); 
    await kit.sendTransactionObject(txObject, { from: kit.defaultAccount })
  }

  async function lenderWithdraw() {
    await initLoad();
    const txObject = await loanContract.methods.lenderWithdraw(); 
    await kit.sendTransactionObject(txObject, { from: kit.defaultAccount })
  }

  useEffect(() => {
    getAccountSummary()
  }, [])

  useEffect(() => {
    getContractSummary()
  }, [])

  async function send(){
    await initLoad();
    // 12. Specify recipient Address
    let anAddress = '0x914c756d7ed05333Ce72fb7049747f2c0b28A326'

    // 13. Specify an amount to send
    let amount = 100

    // 14. Get the token contract wrappers    
    //let goldtoken = await kit.contracts.getGoldToken()
    let stabletoken = await kit.contracts.getStableToken()
    
    // 15. Transfer CELO and cUSD from your account to anAddress
    // Specify cUSD as the feeCurrency when sending cUSD
    //let celotx = await goldtoken.transfer(anAddress, amount).send({from: account.address})
    let cUSDtx = await stabletoken.transfer(anAddress, amount).send({from: account.address, feeCurrency: stabletoken.address})
    
    // 16. Wait for the transactions to be processed
    //let celoReceipt = await celotx.waitReceipt()
    let cUSDReceipt = await cUSDtx.waitReceipt()
    
    // 17. Print receipts
    //console.log('CELO Transaction receipt: %o', celoReceipt)
    console.log('cUSD Transaction receipt: %o', cUSDReceipt)
    
    // 18. Get your new balances
    //let celoBalance = await goldtoken.balanceOf(account.address)
    let cUSDBalance = await stabletoken.balanceOf(account.address)
    
    // 19. Print new balance
    //console.log(`Your new account CELO balance: ${celoBalance.toString()}`)
    console.log(`Your new account cUSD balance: ${cUSDBalance.toString()}`)
}

  return (
    <main>
      <h1>Lova</h1>
      <div>
        <button onClick={connect}>Click here to connect your wallet</button>
      </div>
      <div>
        <button onClick={send}>Click here send</button>
      </div>
      <div>----</div>
      <div>
        <div>Network: {network.name}</div>
        <div>Address: {account.address}</div>
        <div>Celo: {account.CELO}</div>
        <div>cUSD: {account.cUSD}</div>
        <div>cEUR: {account.cEUR}</div>
      </div>
      <div>----</div>
      <div>
        <div>Amount Requested: {loan.amountRequested}</div>
        <div>Amount Raised: {loan.amountRaised}</div>
        <div>Amount Left To Fund: {loan.amountLeftToFund}</div>
        <div>Amount Repaid: {loan.amountRepaid}</div>
        <div>Amount Lender Has Withdrawn: {loan.amountLenderHasWithdraw}</div>
        <div></div>
        <div></div>
      </div>
      <div>----</div>
      <div>
        <button onClick={approve}>Approve spend limit</button>
        <button onClick={lenderLend}>Lender lend</button>
        <button onClick={borrowerWithdraw}>Borrower withdraw</button>
        <button onClick={borrowerRepay}>Borrwer repay</button>
        <button onClick={lenderWithdraw}>Lender withdraw</button>
      </div>
    </main>
  )
}

function WrappedApp() {
  return (
    <ContractKitProvider
      dapp={{
          name: "My awesome dApp",
          description: "My awesome description",
          url: "https://example.com",
        }}
    >
      <App />
    </ContractKitProvider>
  );
}
export default WrappedApp;
