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

  // TODO Move these to configs
  // Alfajores
  const loanAddress = '0x88c6B693B2A79B6f8F55057c8955ce4B32746450';
  const cusdAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1';
  const borrowerAddress = '0x50D3E37AfC58F8eb31a115a9c1E8AA86782e1cf8'
  // Local
  // const loanAddress = '0x6f42BfAe79aefA1f99553770ACd24A4A037039c1';
  // const cusdAddress = '0x10A736A7b223f1FE1050264249d1aBb975741E75';
  // const borrowerAddress = '0x914c756d7ed05333Ce72fb7049747f2c0b28A326'

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
    // TODO kit.getTotalBalance() seems to throw a "execution reverted: Unknown account" metamask error
    const totalBalance = await kit.getTotalBalance(kit.defaultAccount);
    account = {
      address: kit.defaultAccount,
      CELO: totalBalance.CELO.shiftedBy(-ERC20_DECIMALS).toFixed(18),
      cUSD: totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(18),
      cEUR: totalBalance.cEUR.shiftedBy(-ERC20_DECIMALS).toFixed(18),
    };
    setAccount(account);
  }

  async function getContractSummary() {
    await initLoad();
    const amountRequested = await loanContract.methods.amountRequested().call();
    const amountRaised = await loanContract.methods.amountRaised().call();
    const amountBorrowerHasWithdraw = await loanContract.methods.amountBorrowerHasWithdraw().call();
    const amountRepaid = await loanContract.methods.amountRepaid().call();
    const amountLenderHasWithdraw = await loanContract.methods.amountLenderHasWithdraw().call();
    loan = {
      amountRequested,
      amountRaised,
      amountBorrowerHasWithdraw,
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
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await getAccountSummary();
    await getContractSummary();
  }

  async function borrowerWithdraw() {
    await initLoad();
    const txObject = await loanContract.methods.borrowerWithdraw(); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await getAccountSummary();
    await getContractSummary();
  }

  async function borrowerRepay() {
    await initLoad();
    // Hard-coding to repay 2 for now
    const txObject = await loanContract.methods.borrowerRepay(50); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await getAccountSummary();
    await getContractSummary();
  }

  async function lenderWithdraw() {
    await initLoad();
    const txObject = await loanContract.methods.lenderWithdraw(); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await getAccountSummary();
    await getContractSummary();
  }

  useEffect(() => {
    getAccountSummary()
  }, [])

  useEffect(() => {
    getContractSummary()
  }, [])

  return (
    <main>
      <h1>Lova</h1>
      <div>
        <button onClick={connect}>Click here to connect your wallet</button>
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
        <div>Amount Borrower Has Withdrawn: {loan.amountBorrowerHasWithdraw}</div>
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
