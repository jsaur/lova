# Lova

This is a hackathon project for Kiva-style crowd-funded microloans on the Celo blockchain.

## Getting Started

You need to have Node (Node.js v12.x), NPM and yarn installed.

The scaffolding is based on [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

First install the dependencies with:
```bash
yarn
```

Then run the development server:

```bash
yarn dev
```

To interact with the Celo blockchain you will need a Celo wallet. For simplicity of dev development we recommend the Celo Extension Wallet for Chome (works on Brave too).
It's recommended to use the Alfajores Tes Network, use can use the [faucet](https://celo.org/developers/faucet) to get some test CELO and stables.

## TODO

Right now the webapp just displays a button to connect Celo wallet, and fetches the address and balances of the connected wallet.
Right not I'm manually deploying the Loan contract to Alfajores, and pasting the compiled ABI into the build folder,
eventually I want it so that buidling and deploying all happens from this repo.