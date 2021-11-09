import React, { useCallback, useEffect, useState } from 'react';
import { BigNumber } from 'bignumber.js';
import { StableToken } from '@celo/contractkit';
import { useContractKit } from '@celo-tools/use-contractkit';
import Web3 from 'web3';
import lovaJson from '../truffle/build/contracts/Lova.json';
import Head from 'next/head';
import ContractButton from '../components/contractbutton';
import Sidebar from '../components/sidebar';
import Rightbar from '../components/rightbar';
import OutlinedCard from '../components/outlinedcard';
import useStyles from '../src/usestyles';
import BorrowerCard from '../components/borrowercard';
import { Button, Typography, Modal, Box, Divider, TextField, CircularProgress} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { toast } from '../components';

const defaultSummary = {
  name: '',
  address: '',
  wallet: '',
  celo: new BigNumber(0),
  cusd: new BigNumber(0),
  ceur: new BigNumber(0),
  cusdAllowance: new BigNumber(0)
};
const defaultGasPrice = 100000000000;
const ERC20_DECIMALS = 18;

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
  const [transacting, setTransacting] = useState(false);
  const [loading, setLoading] = useState(false);
  

  // TODO Move these to configs
  // Alfajores
  const lovaAddress = '0x003078feADd721C37f08d934EE7F71576285EdA7';
  const cusdAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1';
  const ceurAddress = '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F';
  const kivaApiUrl = 'https://api.kivaws.org/v2/loans/';
  const kivaImageUrl = 'https://www-kiva-org-0.freetls.fastly.net/img/w480h360/';
  const lovaAbi: any = lovaJson.abi; // hack to fix abi types
  const lovaContract = new kit.web3.eth.Contract(lovaAbi, lovaAddress);

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
    const [summary, celo, cusd, ceur, cusdAllowance] = await Promise.all([
      accounts.getAccountSummary(address).catch((e) => {
        console.error(e);
        return defaultSummary;
      }),
      goldToken.balanceOf(address),
      cUSD.balanceOf(address),
      cEUR.balanceOf(address),
      cUSD.allowance(address, lovaAddress)
    ]);
    setSummary({
      ...summary,
      celo,
      cusd,
      ceur,
      cusdAllowance
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

    try {
      setLoading(true);
      let loans = [];
      const loanCount = await lovaContract.methods.loanCount().call();
      // Fetch loans in reverse order
      for (let loanId = loanCount -1 ; loanId >= 0; loanId--) {
        const loanInfo = await lovaContract.methods.loanInfo(loanId).call();
        const sharesLeft = await lovaContract.methods.sharesLeft(loanId).call();
        const kivaData = await getKivaData(loanInfo.kivaId);
        const loan = { loanId, ...loanInfo, sharesLeft, ...kivaData };
        loans.push(loan);
      }
      setLoans(loans);
    } catch(e) {

    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetches data from Kiva's API
   */
  async function getKivaData(kivaId: number) {
    try {
      const res = await fetch(kivaApiUrl + kivaId);
      const data = await res.json();
      return {
        title: data.properties.name,
        description: `This loan helps ${data.properties.use}`,
        imgsource: kivaImageUrl + data.entities[1].properties.hash + '.jpg'
      }
    } catch (e) {
      console.log('Error fetching data ' + (e as Error).message);
    }
  }

  /**
   * Wrapper function for contract calls to handle the transacting flag and errors
   */
  async function wrapContractCall(fn: (...args) => void, ...args) {
    try {
      setTransacting(true);
      await fn(...args);
    } catch (e) {
      console.log(e);
      toast.error((e as Error).message);
    } finally {
      setTransacting(false);
    }
  }

  /**
   * Approve contract to spend cUSD, defaulting to 10,000 for now
   * This only needs to be called once, if cusdAllowance > 0 then this can be skipped
   */
  async function approve() {
    const cUSD = await kit.contracts.getStableToken(StableToken.cUSD);
    const approveLimit = Web3.utils.toWei('10000', 'ether');
    let receipt = await cUSD
      .approve(lovaAddress, approveLimit)
      .sendAndWaitForReceipt({ from: kit.defaultAccount, gasPrice: defaultGasPrice });
    console.log(receipt);
    fetchSummary();
  }

  /** 
   * TODO right now we hard-code a 5 dollar loan with 5 shares and a random kiva id
   * We should add a text box to make it customizable
   */
  async function mint() {
    const borrower = kit.defaultAccount;
    const token = cusdAddress;
    const amountRequested = (5 * 10**ERC20_DECIMALS).toString();
    const sharePrice = (1 * 10**ERC20_DECIMALS).toString();;
    const kivaId = 1000000 + (Math.floor(Math.random() * 1000000));

    const txObject = await lovaContract.methods.mint(borrower, token, amountRequested, sharePrice, kivaId);
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount, gasPrice: defaultGasPrice });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    fetchSummary();
    getLoans();
  }

  /**
   * Lend to loan id - hard coding number of shares
   */
  async function lend(loanId) {
    const numShares = 5;

    const txObject = await lovaContract.methods.lend(loanId, numShares);
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount, gasPrice: defaultGasPrice });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    fetchSummary();
    getLoans();
  }

  /**
   * Called by the borrower to withdraw the borrow amount
   */
  async function borrow(loanId) {
    const txObject = await lovaContract.methods.borrow(loanId); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount, gasPrice: defaultGasPrice });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    fetchSummary();
    getLoans();
  }

  /**
   * Called by the borrower to repay to the loan contract
   */
  async function repay(loanId) {
    const repayAmount = (2.5 * 10**ERC20_DECIMALS).toString();

    const txObject = await lovaContract.methods.repay(loanId, repayAmount); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount, gasPrice: defaultGasPrice });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    fetchSummary();
    getLoans();
  }

  /**
   * Called by the lender to burn loan shares in exchange for withdrawing tokens
   */
  async function burn(loanId) {
    const account = kit.defaultAccount;
    const numShares = 5;

    const txObject = await lovaContract.methods.burn(account, loanId, numShares); 
    let tx = await kit.sendTransactionObject(txObject, { from: kit.defaultAccount, gasPrice: defaultGasPrice });
    let receipt = await tx.waitReceipt();
    console.log(receipt);
    fetchSummary();
    getLoans();
  }

  /**
   * Complex logic based on the state of the loan and whether the address is a borrower or lender
   */
  function Buttons(props) {
    if (!address) {
      return (<div></div>);
    }
    const loanId = props.loan.loanId;
    if (props.loan.currentState == 0 && props.loan.borrower != address) {
      return (<ContractButton transacting={transacting} className={classes.primaryBtn} onClick={() => wrapContractCall(lend, loanId)} text="Lend" />);
    }
    if (props.loan.currentState == 1 && props.loan.borrower == address) {
      return (<ContractButton transacting={transacting} className={classes.primaryBtn} onClick={() => wrapContractCall(borrow, loanId)} text="Borrow" />);
    }
    if (props.loan.currentState == 2 && props.loan.borrower == address) {
      return (<ContractButton transacting={transacting} className={classes.primaryBtn} onClick={() => wrapContractCall(repay, loanId)} text="Repay" />);
    }
    if (props.loan.currentState == 3 && props.loan.ownerBalance > 0) {
      return (<ContractButton transacting={transacting} className={classes.primaryBtn} onClick={() => wrapContractCall(burn, loanId)} text="Withdraw" />);
    }
    return (<div></div>);
  }

  /**
   * Helper function to convert state enum into string
   */
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
                    <ContractButton transacting={transacting} className={classes.primaryBtn} onClick={() => wrapContractCall(approve)} text="Approve cUSD" />
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

        {address ? 
          (<div>
            <div>
              <Typography variant="h6" className={classes.smallerTitle}>
                Active loans
              </Typography>
            </div>
            {loading ? 
              (<CircularProgress color="inherit" />) 
              : 
              (<div className="grid grid-cols-2 gap-4">
                {
                  loans.map((loan) => 
                    <div key={loan.loanId}>
                      <BorrowerCard title={loan.title} description={loan.description} imgsource={loan.imgsource} state={currentState(loan.currentState)}>
                        <Buttons loan={loan} />
                      </BorrowerCard>
                    </div>
                  )
                } 
              </div>)
            }
          </div>)
          : 
          (
            <Typography variant="h6" className={classes.smallerTitle}>
              Connect wallet to view loans
            </Typography>
          )
        }
        
        <Rightbar>
          {address ? 
            (<Button variant="contained" className={classes.primaryBtn} onClick={() => 
              destroy().catch((e) => toast.error((e as Error).message))
            }>Disconnect</Button>)
            : 
            (<Button variant="contained" className={classes.primaryBtn} onClick={() =>
                connect().catch((e) => toast.error((e as Error).message))
            }>Connect</Button>)
          }
          {address && (
            <div>
              <Typography sx={{fontWeight: 'bold', marginTop: '24px'}}>Wallet Information</Typography>
              <Typography sx={{color: '#4E4B66', fontSize: '0.9rem'}}>Network: {network.name}</Typography>
              <Typography sx={{color: '#4E4B66', fontSize: '0.9rem'}}>Address: {truncateAddress(address)}</Typography>
              <Typography sx={{color: '#4E4B66', fontSize: '0.9rem'}}>Celo: {Web3.utils.fromWei(summary.celo.toFixed())}</Typography>
              <Typography sx={{color: '#4E4B66', fontSize: '0.9rem'}}>cUSD: {Web3.utils.fromWei(summary.cusd.toFixed())}</Typography>
              <Typography sx={{color: '#4E4B66', fontSize: '0.9rem'}}>cEUR: {Web3.utils.fromWei(summary.ceur.toFixed())}</Typography>
              <Typography sx={{color: '#4E4B66', fontSize: '0.9rem'}}>cUSD Allowance: {Web3.utils.fromWei(summary.cusdAllowance.toFixed())}</Typography>
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
            <div>
              <ContractButton className={classes.primaryBtn} onClick={() => wrapContractCall(mint)} text="Create Loan" transacting={transacting} />
            </div>
        </div>
        </Rightbar>
      </main>
    </div>
  )
}
