# Lova

This is a hackathon project for Kiva-style crowdfunded microloans on the Celo blockchain.

## Background

The crowdfunding platform Kiva allows internets users to connect and lend directly to borrowers around the world at 0% interest. However due to the nature of web 2.0 there are a number of parties that sit in between borrowers and lenders. With web 3.0 and blockchain there's the oppurtunity for them to connect directly.

Celo is a mobile-first blockchain aimed at the developing world. Some of the benefits it provides is low transactions costs, native support for stable coins, the ability to pay transaction fees in stables coins, and various optimizations for low-bandwidth mobile envirnoments.

This project contains both a DeFi smart contract and a front end Dapp to interact with it. The smart contract is based on the ERC1155 standard which allows generating multiple loans that are each unique, similar to an NFT, while also allowing each loan to contain shares which are generic and interchanagable. A borrower can "mint" or create a loan via the smart contract with a metadata based on Kiva's API. They can choose any ERC20 to demoninate the loan, by default though, it's cUSD the native Celo stable coin. Lenders can lend to specific loans by exchanging ERC20 tokens for loan shares. When the borrower repays to the loan contract, these loan shares can then be "burned" or exchanged back for ERC20 tokens.

One of the advantages of Defi is composablity and extensibility. For example lenders could easily trade or transfer loan shares on a secondary market, something that's not possible with Kiva today. It would also be possible to pool loan shares into various tranches to provide lower risk and higher risk lending pools. Also because the blockchain is a public record of transations, it also servers as a credit history for borrower to be able to take on larger and larger loans.

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

## Deployment

This has been deployed via Vercel to https://lova-jv2frqji6-jsaur.vercel.app/

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

## Demo

In order to see the full flow, you need to run through the following steps:
1. Create first account in Metamask, get test Celo and test cUSD from faucet. This will be the "Lender account"
2. Click "Approve spend limit" which grants the lova contract the ability to spend up to 100$ from your account. Note: for each action it requires approval in metamask
3. Create a second account in Metamask, and get test Celo. This will be the "Borrower account"
4. Click "Approve spend limit" on that account too
5. As the borrower click "Create and mint 5$ loan", this value is hard-coded for now, but we should make it an input. This creates a loan.
6. Switch to the lender account, and click "lend". This is hard-coded to automatically lend the full $5 (we can make an input)
7. Switch to borrower account, and click "borrow". This withdraws the loan amount from the contract and into your balance.
8. As borrower submit your first repayment by clicking "repay". This is hard-coded to repay $2.50
9. Click it a second time to fully repay the loan
10. Switch to the lender accound and click burn and withdraw - with will burn all your outstanding shares, and send you the cUSD balance.


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

## Error to watch out for

The maximum gas limit for a block on celo is 10,000,000 gas - don't try to set a gas amount higher than that in metamask or you'll get the error message:
"exceeds block gas limit"

## TODO

Right now the webapp just displays a button to connect Celo wallet, and fetches the address and balances of the connected wallet.
Right not I'm manually deploying the Loan contract to Alfajores, and pasting the compiled ABI into the build folder,
eventually I want it so that buidling and deploying all happens from this repo.