# Lova

This is a hackathon project for Kiva-style crowd-funded microloans on the Celo blockchain.

## Getting Started

You need to have Node (Node.js v12.x), NPM and yarn installed. If using nvm please run this before continuing:
```bash
nvm use 12
```

## The webapp

The scaffolding is based on [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

First install the dependencies with:
```bash
yarn
```

Then run the development server:

```bash
yarn dev
```

## Truffle

You can use truffle and the celo-devchain to deploy contracts locally.
Note: celo-devchain is preferable to ganache because it includes all the celo specific contracts like cUSD
Note: I wasn't able to test against celo-devchain with either: 
a) Celo Extension Wallet: because I got "Error: [ethjs-rpc] rpc error with payload"
b) Metamask: because it interacts with celo-devchain as if it were Eth based

Here are the steps to get things set up

Installs:
```bash
cd truffle
npm install -g truffle
npm install --save-dev celo-devchain
```

Then start the celo blockchain locally:
```bash
export NO_SYNCCHECK=true
npx celo-devchain --port 8545
```

In a new tab run truffle migration to deploy the contracts (from the truffle folder):
```bash
truffle migrate --network test
```

Transfer celo to your wallet address. First use account:list to view all accounts, choose one to send from, and the send to your metamask account address.
Eg something like:
```bash
celocli account:list
celocli transfer:celo --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --to 0x817aBe07b808174Fc19AcE032d94a7213D8A76d8 --value 1000000000000000000000
celocli transfer:dollars --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --to 0x817aBe07b808174Fc19AcE032d94a7213D8A76d8 --value 1000000000000000000000
```

To figure out the address of, for example cUSD, use network:contracts, eg 0x10A736A7b223f1FE1050264249d1aBb975741E75
Add tokens:
```bash
celocli network:contracts
```

## Alfajores Testnet

We want to be able to test on multiple devices, including mobile, so using the Testnet is better than a local celo-devchain on a single machine.

To work with Alfajores you need a compatible wallet, for desktop development the 2 options are Celo Extension Wallet and Metamask.
I was unable to get CEW to work with Alfajores, firstly it suggests super high gas costs, and even if I adjust lower the transaction still never gets processed

So I recommend using metamask, even though it doesn't support all the Celo features like paying for transactions with cUSD.
Add a custom RPC:
```
Network Name: Celo (Alfajores Testnet)
New RPC URL: https://alfajores-forno.celo-testnet.org
Chain ID: 44787
Currency Symbol (Optional): CELO
Block Explorer URL (Optional): https://alfajores-blockscout.celo-testnet.org
```

In order to use the Alfajores Test Network, you'll need some test Celo and cUSD from the [faucet](https://celo.org/developers/faucet).

## Error to watch out for

The maximum gas limit for a block on celo is 10,000,000 gas - don't try to set a gas amount higher than that in metamask or you'll get the error message:
"exceeds block gas limit"

## TODO

Right now the webapp just displays a button to connect Celo wallet, and fetches the address and balances of the connected wallet.
Right not I'm manually deploying the Loan contract to Alfajores, and pasting the compiled ABI into the build folder,
eventually I want it so that buidling and deploying all happens from this repo.