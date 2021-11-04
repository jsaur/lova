import React, { useEffect, useState } from 'react';
import { useContractKit } from '@celo-tools/use-contractkit';
import { ContractKitProvider } from '@celo-tools/use-contractkit';
import '@celo-tools/use-contractkit/lib/styles.css';
import lovaJson from '../truffle/build/contracts/Lova.json';
import erc20Json from '../truffle/build/contracts/ERC20.json';
import Head from 'next/head';
import Sidebar from '../components/sidebar';
import Rightbar from '../components/rightbar';
import OutlinedCard from '../components/outlinedcard';
import { makeStyles } from '@mui/styles';
import theme from '../src/theme';
import BorrowerCard from '../components/borrowercard';

import { Button, Typography, Modal, Box, Divider, TextField} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const useStyles = makeStyles({
  primaryBtn: {
    backgroundColor: theme.palette.primary.main,
    textTransform: 'none',
    '&:hover': {
      background: "#2FA06A",
    }
  },
  arrowButton: {
    backgroundColor: 'white',
    borderRadius: '15px',
    color: theme.palette.secondary.main,
    boxShadow: 'none',
    padding: '8px',
    minWidth: 'auto',
    '&:hover': {
      background: "#2FA06A",
      color: 'white',
    }
  },
  linkBtn:  {
    color: theme.palette.primary.main,
    textTransform: 'none',
    textDecoration: 'underline',
    fontWeight: 'bold',
  },
  modalWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    backgroundColor: '#FFFFFF',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    padding: '25px',
  },
  bigTitle: {
    fontWeight: 'bold',
    letterSpacing: 0,
  },
  smallerTitle: {
    fontWeight: 'bold',
  },
  mainCaption: {
    color: '#4E4B66',
    fontSize: '0.9rem',
  }
});

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
    getAccountSummary()
  }, [])

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
          <BorrowerCard title="Mburukuja Poty Group" description="A loan of $2,900 helps a member to buy vegetables, beef, chicken, ham, cheese, eggs, and more." imgsource="/img/potygroup.jpg">
              <Button variant="contained" className={classes.primaryBtn}>Withdraw</Button>
          </BorrowerCard>
          <BorrowerCard title="Flor De Coco Group" description="A loan of $2,825 helps a member to buy clothing to resell in her community." imgsource="/img/flordecoco.jpg">
            <Button variant="contained" className={classes.primaryBtn}>Withdraw</Button>
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
        
          <Button  variant="contained" className={classes.primaryBtn} onClick={connect}>Connect wallet</Button>
          <Typography sx={{fontWeight: 'bold', marginTop: '24px'}}>
            Wallet Information
          </Typography>
          <Typography sx={{color: '#4E4B66', fontSize: '0.9rem'}}>Network: {network.name}</Typography>
          <Typography noWrap="false" sx={{color: '#4E4B66', fontSize: '0.9rem'}}>Address: {account.address}</Typography>
          <Typography sx={{color: '#4E4B66', fontSize: '0.9rem'}}>Celo: {account.CELO}</Typography>
          <Typography sx={{color: '#4E4B66', fontSize: '0.9rem'}}>cUSD: {account.cUSD}</Typography>
          <Typography sx={{color: '#4E4B66', fontSize: '0.9rem'}}>cEUR: {account.cEUR}</Typography>
         
         <Divider />
          <div>
            <div>
              <Button className={classes.linkBtn} onClick={getAccountSummary}>Refresh account</Button>
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
