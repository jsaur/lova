import React, { useEffect, useState } from 'react';
import { useContractKit } from '@celo-tools/use-contractkit';
import { ContractKitProvider } from '@celo-tools/use-contractkit';
import '@celo-tools/use-contractkit/lib/styles.css';

function App () {
  const { connect, network, getConnectedKit} = useContractKit();
  const [account, setAccount] = useState([]);
  const ERC20_DECIMALS = 18;

  async function getAccountSummary() {
    console.log('----getAccountSummary------');
    const kit = await getConnectedKit();
    const web3Accounts = await kit.web3.eth.getAccounts();
    kit.defaultAccount = web3Accounts[0];
    const totalBalance = await kit.getTotalBalance(kit.defaultAccount);
    const account = {
      address: kit.defaultAccount,
      CELO: totalBalance.CELO.shiftedBy(-ERC20_DECIMALS).toFixed(2),
      cUSD: totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2),
      cEUR: totalBalance.cEUR.shiftedBy(-ERC20_DECIMALS).toFixed(2),
    };
    setAccount(account);
  }

  useEffect(() => {
    getAccountSummary()
  }, [])

  return (
    <main>
      <h1>Lova</h1>
      <div>
        <button onClick={connect}>Click here to connect your wallet</button>
      </div>
      <div>Network: {network.name}</div>
      <div>Address: {account.address}</div>
      <div>Celo: {account.CELO}</div>
      <div>cUSD: {account.cUSD}</div>
      <div>cEUR: {account.cEUR}</div>
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
