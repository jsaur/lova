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

## The contracts

The best way to test the contracts is to deploy a celo blockchain locally

```bash
cd truffle
npm install -g truffle
npm install --save-dev celo-devchain
```

Then start the celo blockchain locally
```bash
export NO_SYNCCHECK=true
npx celo-devchain --port 8545
```

In a new tab run truffle migration to deploy the contracts
```bash
truffle migrate --network test
```

Transfer celo to your wallet address
```bash
celocli transfer:celo --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --to 0x817aBe07b808174Fc19AcE032d94a7213D8A76d8 --value 1000000000000000000000
celocli transfer:dollars --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --to 0x817aBe07b808174Fc19AcE032d94a7213D8A76d8 --value 1000000000000000000000
```

Add tokens
```bash
celocli network:contracts
```
eg 0x10A736A7b223f1FE1050264249d1aBb975741E75


To interact with the Celo blockchain you will need a Celo wallet. For simplicity of dev development we recommend the Celo Extension Wallet for Chome (works on Brave too).
It's recommended to use the Alfajores Tes Network, use can use the [faucet](https://celo.org/developers/faucet) to get some test CELO and stables.

## TODO

Right now the webapp just displays a button to connect Celo wallet, and fetches the address and balances of the connected wallet.
Right not I'm manually deploying the Loan contract to Alfajores, and pasting the compiled ABI into the build folder,
eventually I want it so that buidling and deploying all happens from this repo.