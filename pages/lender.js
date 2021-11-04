{/*
import React, { useEffect, useState } from 'react';
import { useContractKit } from '@celo-tools/use-contractkit';
import { ContractKitProvider } from '@celo-tools/use-contractkit';
import '@celo-tools/use-contractkit/lib/styles.css';
import lovaJson from '../truffle/build/contracts/Lova.json';
import erc20Json from '../truffle/build/contracts/ERC20.json';
import Head from 'next/head';
import { PrimaryButton, SecondaryButton, toast } from '../components';

function App () {
  const { connect, network, getConnectedKit} = useContractKit();
  let [account, setAccount] = useState([]);
  let [loans, setLoans] = useState([]);
  const ERC20_DECIMALS = 18;

  // TODO Move these to configs
  // Alfajores
  const lovaAddress = '0x003078feADd721C37f08d934EE7F71576285EdA7';
  const cusdAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1';
  const ceurAddress = '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F';
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
  }

  async function getAccountSummary() {
      await initLoad();
      // TODO kit.getTotalBalance() seems to throw a "execution reverted: Unknown account" metamask error
      const totalBalance = await kit.getTotalBalance(kit.defaultAccount);
      account = {
        address: kit.defaultAccount,
        CELO: totalBalance.CELO.shiftedBy(-ERC20_DECIMALS).toFixed(ERC20_DECIMALS),
        cUSD: totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(ERC20_DECIMALS),
        cEUR: totalBalance.cEUR.shiftedBy(-ERC20_DECIMALS).toFixed(ERC20_DECIMALS),
      };
      setAccount(account);
  }

  // TODO there are optimiztions here, eg just get info and update a specific loan, but for now we refetch everything
  async function getLoans() {
    await initLoad();

    let loans = [];
    const loanCount = await lovaContract.methods.loanCount().call();
    // Fetch loans in reverse order
    for (let loanId = loanCount -1 ; loanId >= 0; loanId--) {
      const loanInfo = await lovaContract.methods.loanInfo(loanId).call();
      const sharesLeft = await lovaContract.methods.sharesLeft(loanId).call();
      const ownerBalance = await lovaContract.methods.balanceOf(kit.defaultAccount, loanId).call();
      const loan = { loanId, ...loanInfo, sharesLeft, ownerBalance };
      loans.push(loan);
    }
    setLoans(loans);
  }

  // TODO figure out a better method to keep around kit and contract info without doing initLoad each time
  // TODO right now hard-coding all values - eventually these should come from inputs

  async function approve() {
    const approveLimit = (100 * (10**ERC20_DECIMALS)).toString();;
    await initLoad();

    const txObject = await cusdContract.methods.approve(lovaAddress, approveLimit); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
  }

  // TODO right now we hard-code a 5 dollar loan with 5 shares, we should add a text box to make it customizable
  async function mint() {
    await initLoad();

    const borrower = kit.defaultAccount;
    const token = cusdAddress;
    const amountRequested = (5 * 10**ERC20_DECIMALS).toString();
    const sharePrice = (1 * 10**ERC20_DECIMALS).toString();;
    const kivaId = 2268570;

    const txObject = await lovaContract.methods.mint(borrower, token, amountRequested, sharePrice, kivaId); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await getAccountSummary();
    await getLoans();
  }

  async function lend(loanId) {
    const numShares = 5;

    await initLoad();
    const txObject = await lovaContract.methods.lend(loanId, numShares); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await getAccountSummary();
    await getLoans();
  }

  async function borrow(loanId) {
    await initLoad();
    const txObject = await lovaContract.methods.borrow(loanId); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await getAccountSummary();
    await getLoans();
  }

  async function repay(loanId) {
    const repayAmount = (2.5 * 10**ERC20_DECIMALS).toString();

    await initLoad();
    const txObject = await lovaContract.methods.repay(loanId, repayAmount); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await getAccountSummary();
    await getLoans();
  }

  async function burn(loanId) {
    await initLoad();
    const account = kit.defaultAccount;
    const numShares = 5;

    const txObject = await lovaContract.methods.burn(account, loanId, numShares); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await getAccountSummary();
    await getLoans();
  }

  function Buttons(props) {
    const loanId = props.loan.loanId;
    if (props.loan.currentState == 0) {
      return (<div><PrimaryButton onClick={() => lend(loanId)}>Lender: lend</PrimaryButton></div>);
    }
    if (props.loan.currentState == 1) {
      return (<div><PrimaryButton onClick={() => borrow(loanId)}>Borrower: borrow</PrimaryButton></div>);
    }
    if (props.loan.currentState == 2) {
      return (<div><PrimaryButton onClick={() => repay(loanId)}>Borrower: repay</PrimaryButton></div>);
    }
    if (props.loan.currentState == 3) {
      return <div><PrimaryButton onClick={() => burn(loanId)}>Lender: burn and withdraw</PrimaryButton></div>
    }
  }

  function currentState(currentState) {
    switch(currentState) {
      case "0":
        return 'Funding';
      case "1":
        return 'Raised';
      case "2":
        return 'Repaying';
      case "3":
        return 'Repaid';
      default:
        return 'None'
    }
  }

  useEffect(() => {
    getAccountSummary()
  }, [])

  useEffect(() => {
    getLoans()
  }, [])

  return (
    <div>
      <Head>
        <title>Lova</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="max-w-screen-sm mx-auto py-10 md:py-20 px-4">
        <h1 className="font-bold text-2xl">Lova</h1>
        <div className="flex flex-col md:flex-row md:space-x-4 mb-6">
          <div><PrimaryButton onClick={connect}>Connect wallet</PrimaryButton></div>
        </div>
        <div className="flex flex-col md:flex-row md:space-x-4 mb-6">
          <div><SecondaryButton onClick={getAccountSummary}>Refresh account</SecondaryButton></div>
          <div><SecondaryButton onClick={getLoans}>Refresh loans</SecondaryButton></div>
        </div>
        <div className="font-bold">Wallet Info</div>
        <div className="border px-4 text-gray-600">
          <div>Network: {network.name}</div>
          <div>Address: {account.address}</div>
          <div>Celo: {account.CELO}</div>
          <div>cUSD: {account.cUSD}</div>
          <div>cEUR: {account.cEUR}</div>
        </div>
        <div className="font-bold">General Actions</div>
        <div>
          <div><PrimaryButton onClick={mint}>Borrower: Create and mint $5 loan</PrimaryButton></div>
          <div><PrimaryButton onClick={approve}>Approve spend limit</PrimaryButton></div>
        </div>
        <div className="font-bold">Loans</div>
        <div>
          {
            loans.map((loan) => 
              <div key={loan.loanId} className="border px-4 text-gray-600">
                <div>LoanId: {loan.loanId}</div>
                <div>Borrower: {loan.borrower}</div>
                <div>Token: {loan.token}</div>
                <div>Kiva ID: <a href={"https://api.kivaws.org/v2/loans/" + loan.kivaId}>{loan.kivaId}</a></div>
                <div>Num Shares: {loan.numShares}</div>
                <div>Share Price: {loan.sharePrice}</div>
                <div>Shares Left: {loan.sharesLeft}</div>
                <div>Amount Repaid: {loan.amountRepaid}</div>
                <div>Current State: {currentState(loan.currentState)}</div>
                <div>Owner Share Balance: {loan.ownerBalance}</div>
                <Buttons loan={loan} />
              </div>
            )
          } 
        </div>
      </main>
    </div>
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
*/}