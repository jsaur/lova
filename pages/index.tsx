import React, { useCallback, useEffect, useState } from 'react';
import { BigNumber } from 'bignumber.js';
import { StableToken } from '@celo/contractkit';
import { useContractKit } from '@celo-tools/use-contractkit';
import Web3 from 'web3';
import lovaJson from '../truffle/build/contracts/Lova.json';
import erc20Json from '../truffle/build/contracts/ERC20.json';
import Head from 'next/head';
import Sidebar from '../components/sidebar';
import Rightbar from '../components/rightbar';
import OutlinedCard from '../components/outlinedcard';
import useStyles from '../src/usestyles';
import BorrowerCard from '../components/borrowercard';
import { Button, Typography, Modal, Box, Divider, TextField} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const defaultSummary = {
  name: '',
  address: '',
  wallet: '',
  celo: new BigNumber(0),
  cusd: new BigNumber(0),
  ceur: new BigNumber(0),
};

function truncateAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(36)}`;
}

export default function Home(): React.ReactElement {
  const {
    kit,
    address,
    network,
    updateNetwork,
    connect,
    destroy,
    performActions,
    walletType,
  } = useContractKit();
  const [summary, setSummary] = useState(defaultSummary);
  let [loans, setLoans] = useState([]);
  const ERC20_DECIMALS = 18;

  // TODO Move these to configs
  // Alfajores
  const lovaAddress = '0x003078feADd721C37f08d934EE7F71576285EdA7';
  const cusdAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1';
  const ceurAddress = '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F';
  let lovaContract;
  let cusdContract;

  /**
   * Fetches account summary and token balances
   */
  const fetchSummary = useCallback(async () => {
    if (!address) {
      setSummary(defaultSummary);
      return;
    }

    const [accounts, goldToken, cUSD, cEUR] = await Promise.all([
      kit.contracts.getAccounts(),
      kit.contracts.getGoldToken(),
      kit.contracts.getStableToken(StableToken.cUSD),
      kit.contracts.getStableToken(StableToken.cEUR),
    ]);
    const [summary, celo, cusd, ceur] = await Promise.all([
      accounts.getAccountSummary(address).catch((e) => {
        console.error(e);
        return defaultSummary;
      }),
      goldToken.balanceOf(address),
      cUSD.balanceOf(address),
      cEUR.balanceOf(address),
    ]);
    setSummary({
      ...summary,
      celo,
      cusd,
      ceur,
    });
  }, [address, kit]);

  /**
   * Fetches all loans from the lova contract
   * TODO this isn't very scalable right now, eventually allow pagination
   * TODO right now we need to be connected to fetch loans, I think due to web3 not know which network to connect to
   */
  async function getLoans() {
    if (!address) {
      return;
    }
    const lovaAbi: any = lovaJson.abi;
    lovaContract = new kit.web3.eth.Contract(lovaAbi, lovaAddress);
    let loans = [];
    const loanCount = await lovaContract.methods.loanCount().call();
    // Fetch loans in reverse order
    for (let loanId = loanCount -1 ; loanId >= 0; loanId--) {
      const loanInfo = await lovaContract.methods.loanInfo(loanId).call();
      const sharesLeft = await lovaContract.methods.sharesLeft(loanId).call();
      const loan = { loanId, ...loanInfo, sharesLeft };
      loans.push(loan);
    }
    setLoans(loans);
  }

    // TODO right now hard-coding all values - eventually these should come from inputs

  async function approve() {
    const erc20Abi: any = erc20Json.abi
    cusdContract = new kit.web3.eth.Contract(erc20Abi, cusdAddress);
    const approveLimit = (100 * (10**ERC20_DECIMALS)).toString();;
    const txObject = await cusdContract.methods.approve(lovaAddress, approveLimit); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
  }

  // TODO right now we hard-code a 5 dollar loan with 5 shares, we should add a text box to make it customizable
  async function mint() {
    const borrower = kit.defaultAccount;
    const token = cusdAddress;
    const amountRequested = (5 * 10**ERC20_DECIMALS).toString();
    const sharePrice = (1 * 10**ERC20_DECIMALS).toString();;
    const kivaId = 2268570;

    const txObject = await lovaContract.methods.mint(borrower, token, amountRequested, sharePrice, kivaId); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await fetchSummary();
    await getLoans();
  }

  async function lend(loanId) {
    const numShares = 5;
    const txObject = await lovaContract.methods.lend(loanId, numShares); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await fetchSummary();
    await getLoans();
  }

  async function borrow(loanId) {
    const txObject = await lovaContract.methods.borrow(loanId); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await fetchSummary();
    await getLoans();
  }

  async function repay(loanId) {
    const repayAmount = (2.5 * 10**ERC20_DECIMALS).toString();
    const txObject = await lovaContract.methods.repay(loanId, repayAmount); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await fetchSummary();
    await getLoans();
  }

  async function burn(loanId) {
    const account = kit.defaultAccount;
    const numShares = 5;
    const txObject = await lovaContract.methods.burn(account, loanId, numShares); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    await fetchSummary();
    await getLoans();
  }

  function Buttons(props) {
    const loanId = props.loan.loanId;
    if (props.loan.currentState == 0) {
      return (<div><Button variant="contained" className={classes.primaryBtn} onClick={() => lend(loanId)}>Lender: lend</Button></div>);
    }
    /*if (props.loan.currentState == 1) {
      return (<div><Button   variant="contained"  className={classes.primaryBtn} onClick={() => borrow(loanId)}>Borrower: borrow</Button></div>);
    }
    if (props.loan.currentState == 2) {
      return (<div><Button  variant="contained"  className={classes.primaryBtn} onClick={() => repay(loanId)}>Borrower: repay</Button></div>);
    }*/
    if (props.loan.currentState == 3) {
      return <div><Button  variant="contained"  className={classes.primaryBtn} onClick={() => burn(loanId)}>Lender: burn and withdraw</Button></div>
    }
    return "";
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
    void fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    getLoans()
  }, [])

  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  return (
    <div>
      <Head>
        <title>Lova</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="max-w-screen-sm mx-auto py-10 md:py-20 px-4">
        <Sidebar />
        <div>
          <Typography variant="h4" className={classes.bigTitle}>Welcome to Lova</Typography>
        </div>
        
        <Typography className={classes.mainCaption} variant="caption" sx={{display:"block", marginBottom:"20px"}}>Move cryptocurrency from your wallet onto Lova to start lending to our entrepreneurs.</Typography>
      
        
        <div className="grid grid-cols-2 gap-4">
          <OutlinedCard title="Start lending now" stylename="lend">
            <div>
              <Button onClick={handleOpen} variant="contained" className={classes.arrowButton}>
                <ArrowForwardIcon />
              </Button>
              <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <Box className={classes.modalWrapper}>
                  <Typography id="modal-modal-title" variant="h6" component="h2">
                    Deposit
                  </Typography>
                  <Typography id="modal-modal-description" sx={{ mt: 2, color: '#4E4B66', fontSize: '0.9rem' }}>
                    Move cryptocurrency from your wallet onto Lova to start lending to our entrepreneurs.
                  </Typography>
                  <TextField id="standard-basic" label="# of shares" variant="standard" sx={{marginBottom:'25px', marginTop:'20px'}} />
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="contained" className={classes.primaryBtn} onClick={() => approve()}>Approve cUSD</Button>
                    <Button variant="contained" className={classes.primaryBtn} onClick={() => lend(1)}>Lend</Button>
                  </div>
                </Box>
              </Modal>
            </div>
          </OutlinedCard>
          <OutlinedCard title="Choose your borrower" stylename="borrowers">
            <div>
              <Button variant="contained" className={classes.arrowButton}>
                <ArrowForwardIcon />
              </Button>
            </div>
          </OutlinedCard>
        </div>
         
        <div>
          <Typography variant="h6" className={classes.smallerTitle}>
            Latest repaid loans
          </Typography>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <BorrowerCard title="Soufiane Dari" description="A loan helps Soufiane start his community business and empower his neighborhood." imgsource="/img/soufianeloan.png">
              <Button  variant="contained"  className={classes.primaryBtn} onClick={() => burn(2)}>Withdraw</Button>
          </BorrowerCard>
          <BorrowerCard title="Flor De Coco Group" description="A loan helps a Flor de Coco group member to buy clothing to resell in her community." imgsource="/img/flordecoco.jpg">
            <Button  variant="contained"  className={classes.primaryBtn} onClick={() => burn(2)}>Withdraw</Button>
          </BorrowerCard>
        </div>
        
     
         {/*<div><Button variant="contained"  className={classes.primaryBtn} onClick={mint}>Borrower: Create and mint $5 loan</Button></div>
           <div><Button variant="contained"  className={classes.primaryBtn} onClick={approve}>Approve spend limit</Button></div>*/}
      
        
        <div>
          {/*
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
          */} 
        </div>
        <Rightbar>
          {address ? 
            (<Button  variant="contained" className={classes.primaryBtn} onClick={destroy}>Disconnect</Button>)
            : 
            (<Button  variant="contained" className={classes.primaryBtn} onClick={connect}>Connect</Button>)
          }
          {address && (
            <div>
              <Typography sx={{fontWeight: 'bold', marginTop: '24px'}}>Wallet Information</Typography>
              <Typography sx={{color: '#4E4B66', fontSize: '0.9rem'}}>Network: {network.name}</Typography>
              <Typography sx={{color: '#4E4B66', fontSize: '0.9rem'}}>Address: {truncateAddress(address)}</Typography>
              <Typography sx={{color: '#4E4B66', fontSize: '0.9rem'}}>Celo: {Web3.utils.fromWei(summary.celo.toFixed())}</Typography>
              <Typography sx={{color: '#4E4B66', fontSize: '0.9rem'}}>cUSD: {Web3.utils.fromWei(summary.cusd.toFixed())}</Typography>
              <Typography sx={{color: '#4E4B66', fontSize: '0.9rem'}}>cEUR: {Web3.utils.fromWei(summary.ceur.toFixed())}</Typography>
            </div>
          )}
         <Divider />
          <div>
            <div>
              <Button className={classes.linkBtn} onClick={fetchSummary}>Refresh account</Button>
            </div>
            <div>
              <Button className={classes.linkBtn} onClick={getLoans}>Refresh loans</Button>
            </div>
        </div>
        </Rightbar>
      </main>
    </div>
  )
}
