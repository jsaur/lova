import React, { useEffect, useState } from 'react';
import { useContractKit } from '@celo-tools/use-contractkit';
import { ContractKitProvider } from '@celo-tools/use-contractkit';
import '@celo-tools/use-contractkit/lib/styles.css';
import lovaJson from '../truffle/build/contracts/Lova.json'; // Manually linking ABI for now
import erc20Json from '../truffle/build/contracts/ERC20.json'; // Manually linking ABI for now

function App () {
  const { connect, network, getConnectedKit} = useContractKit();
  let [account, setAccount] = useState([]);
  let [loan, setLoan] = useState([]);
  const ERC20_DECIMALS = 18;

  // TODO Move these to configs
  // Alfajores
  const lovaAddress = '0x3e9D2fa213fC79607fC89B01E308eD74E7Fa3B95';
  const cusdAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1';
  // Local
  // const lovaAddress = '0x6f42BfAe79aefA1f99553770ACd24A4A037039c1';
  // const cusdAddress = '0x10A736A7b223f1FE1050264249d1aBb975741E75';

  let kit;
  let lovaContract;
  let cusdContract;

  // TODO figure out how to run this before the others
  // TODO figure out how to preserve these values through button clicks
  async function initLoad() {
    kit = await getConnectedKit();
    lovaContract = new kit.web3.eth.Contract(lovaJson.abi, lovaAddress);
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
    const loanId = 0;

    await initLoad();
    const loan = await lovaContract.methods.loanInfo(loanId).call();
    console.log(loan);
    setLoan(loan);
  }

  // TODO figure out a better method to keep around kit and contract info without doing initLoad each time
  // TODO right now hard-coding all values - eventually these should come from inputs

  async function approve() {
    const approveLimit = 1000000;
    await initLoad();

    const txObject = await cusdContract.methods.approve(lovaAddress, approveLimit); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
  }

  async function mint() {
    const borrower = "0x50D3E37AfC58F8eb31a115a9c1E8AA86782e1cf8";
    const token = cusdAddress;
    const amountRequested = 100;
    const numShares = 25;

    await initLoad();
    const txObject = await lovaContract.methods.mint(borrower, token, amountRequested, numShares); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
  }

  async function lend() {
    const loanId = 0;
    const numShares = 3;

    await initLoad();
    const txObject = await lovaContract.methods.lend(loanId, numShares); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await getAccountSummary();
    await getContractSummary();
  }

  async function borrow() {
    const loanId = 0;

    await initLoad();
    const txObject = await lovaContract.methods.borrow(loanId); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await getAccountSummary();
    await getContractSummary();
  }

  async function repay() {
    const loanId = 0;
    const repayAmount = 50;

    await initLoad();
    const txObject = await lovaContract.methods.repay(loanId, repayAmount); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await getAccountSummary();
    await getContractSummary();
  }

  async function burn() {
    const loanId = 0;
    const account = kit.defaultAccount;
    const numShares = 4;

    await initLoad();
    const txObject = await lovaContract.methods.burn(account, loanId, numShares); 
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
        <div>Borrower: {loan.borrower}</div>
        <div>Token: {loan.token}</div>
        <div>Num Shares: {loan.numShares}</div>
        <div>Share Price: {loan.sharePrice}</div>
        <div>Amount Repaid: {loan.amountRepaid}</div>
        <div>Current State: {loan.currentState}</div>
        <div></div>
        <div></div>
      </div>
      <div>----</div>
      <div>
        <div><button onClick={mint}>Borrower: Mint loan</button></div>
        <div><button onClick={approve}>Lender: Approve spend limit</button></div>
        <div><button onClick={lend}>Lender: lend</button></div>
        <div><button onClick={borrow}>Borrower: borrow</button></div>
        <div><button onClick={approve}>Borrower: Approve spend limit</button></div>
        <div><button onClick={repay}>Borrower: repay</button></div>
        <div><button onClick={burn}>Lender: burn and withdraw</button></div>
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
