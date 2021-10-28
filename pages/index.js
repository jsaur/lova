import React, { useEffect, useState } from 'react';
import { useContractKit } from '@celo-tools/use-contractkit';
import { ContractKitProvider } from '@celo-tools/use-contractkit';
import '@celo-tools/use-contractkit/lib/styles.css';
import lovaJson from '../truffle/build/contracts/Lova.json';
import erc20Json from '../truffle/build/contracts/ERC20.json';

function App () {
  const { connect, network, getConnectedKit} = useContractKit();
  let [account, setAccount] = useState([]);
  let [loans, setLoans] = useState([]);
  const ERC20_DECIMALS = 18;

  // TODO Move these to configs
  // Alfajores
  const lovaAddress = '0x498aC6614C069EECa0B08dFB4F883356EA7017c7';
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
    const amountRequested = (5 * (10**ERC20_DECIMALS)).toString();
    const numShares = 5;

    const txObject = await lovaContract.methods.mint(borrower, token, amountRequested, numShares); 
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
    const repayAmount = (2.5 * 10^ERC20_DECIMALS).toString();

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
      return (<div><button onClick={() => lend(loanId)}>Lender: lend</button></div>);
    }
    if (props.loan.currentState == 1) {
      return (<div><button onClick={() => borrow(loanId)}>Borrower: borrow</button></div>);
    }
    if (props.loan.currentState == 2) {
      return (<div><button onClick={() => repay(loanId)}>Borrower: repay</button></div>);
    }
    if (props.loan.currentState == 3) {
      return <div><button onClick={() => burn(loanId)}>Lender: burn and withdraw</button></div>
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
    <main>
      <h1>Lova</h1>
      <div>
        <div><button onClick={connect}>Click here to connect your wallet</button></div>
        <div><button onClick={getAccountSummary}>Refresh account</button></div>
        <div><button onClick={getLoans}>Refresh loans</button></div>
      </div>
      <div>-- Wallet Info --</div>
      <div>
        <div>Network: {network.name}</div>
        <div>Address: {account.address}</div>
        <div>Celo: {account.CELO}</div>
        <div>cUSD: {account.cUSD}</div>
        <div>cEUR: {account.cEUR}</div>
      </div>
      <div>-- General Actions --</div>
      <div>
        
        <div><button onClick={mint}>Borrower: Create and mint $5 loan</button></div>
        <div><button onClick={approve}>Approve spend limit</button></div>
      </div>
      <div>--Loans--</div>
      <div>
        {
          loans.map((loan) => 
            <div key={loan.loanId}>
              <div>_________</div>
              <div>LoanId: {loan.loanId}</div>
              <div>Borrower: {loan.borrower}</div>
              <div>Token: {loan.token}</div>
              <div>Num Shares: {loan.numShares}</div>
              <div>Share Price: {loan.sharePrice}</div>
              <div>Shares Left: {loan.sharesLeft}</div>
              <div>Amount Repaid: {loan.amountRepaid}</div>
              <div>Current State: {currentState(loan.currentState)}</div>
              <div>Owner's Share Balance: {loan.ownerBalance}</div>
              <Buttons loan={loan} />
            </div>
          )
        } 
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
