import '@celo-tools/use-contractkit/lib/styles.css';
import '../styles/globals.css';

import { ContractKitProvider, NetworkNames } from '@celo-tools/use-contractkit';
import { AppComponent, AppProps } from 'next/dist/shared/lib/router/router';
import { Toaster } from 'react-hot-toast';

const MyApp: AppComponent = ({ Component, pageProps }: AppProps) => {
  return (
    <ContractKitProvider
      dapp={{
        name: 'Lova',
        description: 'A crowd-funding Dapp for mircoloans',
        url: 'https://lova.vercel.app/',
        icon: 'https://lova.vercel.app//favicon.ico',
      }}
      network={{
        name: NetworkNames.Alfajores,
        rpcUrl: 'https://alfajores-forno.celo-testnet.org',
        graphQl: 'https://alfajores-blockscout.celo-testnet.org/graphiql',
        explorer: 'https://alfajores-blockscout.celo-testnet.org',
        chainId: 44787,
      }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'w-72 md:w-96',
          style: {
            padding: '0px',
          },
        }}
      />
      <div suppressHydrationWarning>
        {typeof window === 'undefined' ? null : <Component {...pageProps} />}
      </div>
    </ContractKitProvider>
  );
};

export default MyApp;