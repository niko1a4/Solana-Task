# Solana Voting dApp

This is a full-stack **Solana blockchain voting application** built with **Anchor**.  
Users can create polls, add candidates, and vote on-chain.  

The backend works as an **indexer** that listens to Solana program accounts and stores them in a database, while the frontend provides a user interface for interacting with the program.

---

## Project Structure
- **/backend** – NestJS service + indexer for syncing blockchain state to the database  
- **/frontend** – React (Vite) app using `@solana/wallet-adapter` and Anchor client  
- **/solana** – Anchor smart contract (program) and IDL  

---

## How to Run

First, install dependencies in each directory:
```bash
npm install
```
### 1. Start backend
```bash 
cd backend
npm run start
```
### 2. Start frontend
```bash
cd frontend
npm run dev
```
The app will be available at http://localhost:5173 . 

### 3. Solana program
You dont need to start Solana program, it's already deployed at devnet.

## Configuration 
RPC endpoint and program ID are stored in `.env` files (both backend and frontend)
Test ledger is ignored via `.gitignore` and not included in the repository.
Program is already deployed on Solana devnet → no need to redeploy

## Features 
Create new polls (on-chain)
Add candidates to a poll
Vote for a candidate
Backend indexer syncs poll & candidate data with the database

## Program Changes
The original program did not store the poll ID inside the on-chain account.
To fix this and make indexing easier, two small changes were made to the Anchor code:

1. Inside the `initialize_poll` instruction, added:
```rust
ctx.accounts.poll_account.poll_id = _poll_id;
```

2. In the PollAccount struct, added:
```rust
pub poll_id: u64,
```
These changes ensure that every PollAccount now keeps track of its own poll ID on-chain,
allowing the backend indexer to directly read and link candidates and votes to the correct poll.

## Devnet Deployment
Program is deployed on Solana devnet. You can view it on the Explorer:
https://explorer.solana.com/address/5DbjRocMRzCHuKgQAJ2TVTkp3JKkG6oZM6QTy5xesvt?cluster=devnet

## License : MIT