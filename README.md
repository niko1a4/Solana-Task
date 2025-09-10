# Solana Voting dApp – Interview Task

## Overview

Build a small full-stack dApp around the provided Anchor program.
**DON'T FOCUS ON UI DESIGN**.
The app must let a user:

1. Create a poll
2. Add candidates to a poll
3. View polls & candidates
4. Vote for a candidate (enforced by on-chain start/end time)
5. See live results (off-chain indexed from on-chain accounts)

You must use a local validator (preferred) or devnet and demonstrate wallet-based signing from the frontend.

---

## What we give you

You already have the program source.

- **PollAccount**: seeds = `[b"poll", poll_id.to_le_bytes()]`
- **CandidateAccount**: seeds = `[poll_id.to_le_bytes(), candidate.as_ref()]`

### Key fields:
- **PollAccount.poll_voting_start / poll_voting_end** (u64, unix seconds)
- **CandidateAccount.candidate_name** (<= 32 chars), **candidate_votes** (u64)

### Program errors:
- **VotingNotStarted**
- **VotingEnded**

---

## Deliverables

### A) Backend (Node/TypeScript)

Implement a minimal indexer + REST API:

1. **Indexer**
   - Connect to the same cluster as the frontend (localnet/devnet).
   - Use websockets to monitor data accounts and store them in database:
     - All `PollAccount`s
     - All `CandidateAccount`s

2. **REST API**
   - `GET /polls` → list: `{ pollId, name, description, start, end, status, totalVotes }`
   - `GET /polls/:pollId` → details + candidates:  
     `{ pollId, name, description, start, end, status, candidates: [{ name, votes }] }`
   - `GET /polls/:pollId/leaderboard` → sorted candidates by votes desc
   - No private keys or signing on the backend.

3. **Env / Config**
   - `.env` with `RPC_URL`, `CLUSTER` (localnet|devnet), DB url.
   - Simple README with setup commands.

---

### B) Frontend (React/TypeScript)

A simple app with wallet adapter and clean UX:

1. **Connect Wallet** (Phantom/Solflare etc.)
2. **Create Poll**
   - Inputs: `pollId` (u64), `name` (<= 32), `description` (<= 280), `startTime`, `endTime` (unix seconds)
   - Transaction: `initialize_poll`
3. **Add Candidate**
   - Inputs: `pollId`, `candidateName` (<= 32)
   - Transaction: `initialize_candidate`
4. **Vote**
   - Inputs: `pollId`, `candidateName`
   - Transaction: `vote`
   - Handle and display program errors (VotingNotStarted, VotingEnded)
5. **Views**
   - Polls list (from your backend REST): status badge with countdown (to start / to end)
   - Poll details: candidates, real-time vote counts, and a Vote button per candidate

> Use `@coral-xyz/anchor` client or raw `@solana/web3.js` + `borsh`; either is fine.  
> For dev UX, include a quick “seed demo data” flow: create a poll that starts ~30s from now and ends ~5 min later.

---

### C) Index Voting Events

**Goal:** Surface a reliable, queryable history of votes without scanning raw accounts.

#### Program (on-chain)

* Add a **vote event** emitted by the `vote` instruction containing, at minimum:

  * `poll_id: u64`
  * `candidate: string`
  * `voter: Pubkey`
  * `slot: u64`
* Emit the event **once per successful vote**.

#### Backend (indexer)

* **Ingest** all `vote` invocations in near real time.
* **Persist** each vote as an immutable record with:

  * `pollId, candidate, voter, signature/txId, slot, blockTime`

#### API

* `GET /polls/:pollId/votes` — chronological vote feed.
* `GET /polls/:pollId/vote-stats` — aggregated counts per candidate derived from events.
* `GET /polls/:pollId/voters/:voter` — all votes by a given voter within a poll.

---

### D) Optional bonus task - Off-chain Poll Description With On-chain Integrity

Update your solution so that poll descriptions are **not stored directly on-chain**, but instead stored off-chain by the backend.  
You can change Solana program for this task.

#### Requirements:
1. When a poll is created, the on-chain account must only contain a **reference** or **proof** that ties it to the exact off-chain description.
2. The backend must ensure that:
   - The description cannot be altered or replaced by anyone after the poll is created.
   - The description is **verifiable** and matches the reference or proof stored on-chain.
3. The API should provide an endpoint for retrieving the **verified description** for a given poll.

#### Goal:
To reduce on-chain storage costs while still preventing manipulation of the description data.