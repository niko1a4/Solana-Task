import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BorshCoder, EventParser, Idl, utils as anchorUtils } from '@coral-xyz/anchor';
import {
    Commitment,
    Connection,
    KeyedAccountInfo,
    Logs,
    PublicKey,
} from '@solana/web3.js';
import { createHash } from 'crypto';

import idlJson from '../idl/voting.json';
import { Poll } from '../polls/poll.entity';
import { Candidate } from '../candidates/candidate.entity';
import { Vote } from '../votes/vote.entity';

//  Types 

type DecodedCandidateAccount = {
    candidate_name: string;
    candidate_votes: unknown;
};

type DecodedPollAccount = {
    poll_id: unknown;
    poll_name: string;
    poll_description: string;
    poll_voting_start: unknown;
    poll_voting_end: unknown;
    poll_option_index: unknown;
};

type VotingEvent = {
    name: 'VoteEvent';
    data: {
        poll_id: string;    // u64 as string
        candidate: string;  // candidate name
        voter: string;      // base58 Pubkey
        slot: string;       // u64 as string
    };
};

type EventMeta = { tx: string; slot: number; blockTime: number };

//  Helpers 

const COMMITMENT: Commitment = 'confirmed';

function discriminatorFor(accountName: string): Buffer {
    return createHash('sha256').update(`account:${accountName}`).digest().subarray(0, 8);
}

function base58(pk: PublicKey): string {
    return pk.toBase58();
}

function toStringSafe(v: unknown): string {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (typeof v === 'bigint') return v.toString();
    const maybe = v as { toString?: () => string };
    if (maybe?.toString) return maybe.toString();
    return String(v);
}

function toBase58Maybe(v: unknown): string {
    if (v && typeof (v as any).toBase58 === 'function') return (v as any).toBase58();
    return String(v ?? '');
}

function parseEventSafe(rawName: string, rawData: Record<string, unknown>): VotingEvent | null {
    if (rawName !== 'VoteEvent') return null;

    const poll_id = toStringSafe(rawData['poll_id']);
    const candidate = String(rawData['candidate'] ?? '');
    const voter = toBase58Maybe(rawData['voter']);
    const slot = toStringSafe(rawData['slot']);

    if (!poll_id || !candidate || !voter) return null;
    return { name: 'VoteEvent', data: { poll_id, candidate, voter, slot } };
}

function writeU64LE(numStr: string): Buffer {
    const n = BigInt(numStr || '0');
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(n);
    return buf;
}

@Injectable()
export class IndexerService implements OnModuleInit, OnModuleDestroy {
    private readonly log = new Logger(IndexerService.name);

    private httpConn!: Connection;
    private wsConn!: Connection;

    private coder!: BorshCoder;
    private programId!: PublicKey;
    private eventParser!: EventParser;

    private acctSubId: number | null = null;
    private logSubId: number | null = null;

    constructor(
        @InjectRepository(Poll) private readonly polls: Repository<Poll>,
        @InjectRepository(Candidate) private readonly candidates: Repository<Candidate>,
        @InjectRepository(Vote) private readonly votes: Repository<Vote>,
    ) { }

    async onModuleInit(): Promise<void> {
        const http = process.env.RPC_HTTP_URL ?? '';
        const ws = process.env.RPC_WS_URL ?? '';
        if (!http) throw new Error('Missing RPC_HTTP_URL in .env');
        if (!process.env.PROGRAM_ID) throw new Error('Missing PROGRAM_ID in .env');

        this.httpConn = new Connection(http, COMMITMENT);
        this.wsConn = new Connection(http, {
            wsEndpoint: ws || http.replace('https', 'wss').replace('http', 'ws'),
            commitment: COMMITMENT,
        });

        this.programId = new PublicKey(process.env.PROGRAM_ID);
        const idl = idlJson as Idl;

        this.coder = new BorshCoder(idl);
        this.eventParser = new EventParser(this.programId, this.coder);

        const version = await this.httpConn.getVersion();
        this.log.log(`Connected to Solana: ${JSON.stringify(version)}`);

        await this.backfillAll();
        await this.subscribeProgramAccounts();
        await this.subscribeLogs();

        this.log.log('Indexer is running (backfilled + live).');
    }

    async onModuleDestroy(): Promise<void> {
        if (this.acctSubId !== null) {
            try {
                await this.wsConn.removeProgramAccountChangeListener(this.acctSubId);
            } catch { }
        }
        if (this.logSubId !== null) {
            try {
                await this.wsConn.removeOnLogsListener(this.logSubId);
            } catch { }
        }
    }

    //  Backfill

    private async backfillAll(): Promise<void> {
        this.log.log('Backfill started…');
        await this.backfillPolls();
        await this.backfillCandidates();
        await this.linkAllCandidatesByReversePda();
        this.log.log('Backfill finished.');
    }

    private async backfillCandidates(): Promise<void> {
        const disc = discriminatorFor('CandidateAccount');
        const accounts = await this.httpConn.getProgramAccounts(this.programId, {
            commitment: COMMITMENT,
            filters: [{ memcmp: { offset: 0, bytes: anchorUtils.bytes.bs58.encode(disc) } }],
        });

        for (const acc of accounts) {
            await this.handleCandidateAccount(acc.pubkey, acc.account.data as Buffer);
        }
    }

    private async backfillPolls(): Promise<void> {
        const disc = discriminatorFor('PollAccount');
        const accounts = await this.httpConn.getProgramAccounts(this.programId, {
            commitment: COMMITMENT,
            filters: [{ memcmp: { offset: 0, bytes: anchorUtils.bytes.bs58.encode(disc) } }],
        });

        for (const acc of accounts) {
            await this.handlePollAccount(acc.pubkey, acc.account.data as Buffer);
        }
    }

    //Subscriptions 

    private async subscribeProgramAccounts(): Promise<void> {
        this.acctSubId = this.wsConn.onProgramAccountChange(
            this.programId,
            async (info: KeyedAccountInfo) => {
                const key = info.accountId;
                const data = info.accountInfo.data as Buffer;

                try {
                    if (this.isAccountOfType(data, 'CandidateAccount')) {
                        await this.handleCandidateAccount(key, data);
                        await this.linkCandidateByReversePda(key.toBase58());
                    } else if (this.isAccountOfType(data, 'PollAccount')) {
                        await this.handlePollAccount(key, data);
                    }
                } catch (e) {
                    this.log.error(`Account change handler failed: ${(e as Error).message}`);
                }
            },
            COMMITMENT,
        );
    }

    private isAccountOfType(data: Buffer, accountName: string): boolean {
        const disc = discriminatorFor(accountName);
        return data.slice(0, 8).equals(disc);
    }

    private async subscribeLogs(): Promise<void> {
        this.logSubId = await this.wsConn.onLogs(
            this.programId,
            async (logInfo: Logs) => {
                const meta = await this.fetchSlotAndTime(logInfo.signature);

                const it = this.eventParser.parseLogs(logInfo.logs);
                for (const evt of it) {
                    const pe = parseEventSafe(
                        (evt as { name: string }).name,
                        (evt as { data: Record<string, unknown> }).data,
                    );
                    if (pe) {
                        await this.handleEvent(pe, { tx: logInfo.signature, ...meta });
                    }
                }
            },
            COMMITMENT,
        );
    }

    private async fetchSlotAndTime(signature: string): Promise<{ slot: number; blockTime: number }> {
        //try to fetch tx by its signature
        const txResp = await this.httpConn.getTransaction(signature, {
            maxSupportedTransactionVersion: 0,  //suport only legacy tx
            commitment: COMMITMENT,
        } as any);

        //if tx exists , extract slot and bt from it
        if (txResp) {
            const slot = (txResp as { slot?: number }).slot ?? 0;
            const blockTime = (txResp as { blockTime?: number | null }).blockTime ?? 0;
            return { slot, blockTime };
        }
        //if above fails tries getSignatureStatuses
        const statuses = await this.httpConn.getSignatureStatuses([signature], {
            searchTransactionHistory: true,
        });
        const st = statuses.value[0];
        //if a status is found and has a slot -> fetch block time separately
        if (st?.slot != null) {
            //block time 
            const bt = await this.httpConn.getBlockTime(st.slot);
            return { slot: st.slot, blockTime: bt ?? 0 };
        }
        //if everything fails return 0s
        return { slot: 0, blockTime: 0 };
    }

    //  Handlers 

    private async handleCandidateAccount(pubkey: PublicKey, raw: Buffer): Promise<void> {
        try {
            const decoded = this.coder.accounts.decode('CandidateAccount', raw) as DecodedCandidateAccount;

            const candidateAccount = base58(pubkey);
            const candidateName = decoded?.candidate_name ?? '';
            const candidateVotes = toStringSafe(decoded?.candidate_votes ?? '0');

            const existing = await this.candidates.findOne({ where: { candidateAccount } });
            if (existing) {
                await this.candidates.save({
                    candidateAccount,
                    name: candidateName,
                    votes: candidateVotes,
                });
            } else {
                await this.candidates.save(
                    this.candidates.create({
                        candidateAccount,
                        pollId: null,
                        name: candidateName,
                        votes: candidateVotes,
                    }),
                );
            }

        } catch (e) {
            this.log.error(`Failed to decode CandidateAccount: ${(e as Error).message}`);
        }
    }

    private async handlePollAccount(pubkey: PublicKey, raw: Buffer): Promise<void> {
        try {
            const decoded = this.coder.accounts.decode('PollAccount', raw) as DecodedPollAccount;

            const pollAccount = base58(pubkey);
            const pollId = toStringSafe(decoded?.poll_id ?? '');

            const patch = {
                pollAccount,
                pollId: pollId || null,
                name: decoded?.poll_name ?? '',
                description: decoded?.poll_description ?? '',
                start: toStringSafe(decoded?.poll_voting_start ?? '0'),
                end: toStringSafe(decoded?.poll_voting_end ?? '0'),
                optionIndex: toStringSafe(decoded?.poll_option_index ?? '0'),
            };

            const existing = await this.polls.findOne({ where: { pollAccount } });
            if (existing) {
                await this.polls.save({ ...(existing as any), ...patch });
            } else {
                await this.polls.save(this.polls.create(patch));
            }

        } catch (e) {
            this.log.error(`Failed to decode PollAccount: ${(e as Error).message}`);
        }
    }

    private deriveCandidatePda(pollId: string, candidateName: string): string {
        const [pda] = PublicKey.findProgramAddressSync(
            [writeU64LE(pollId), Buffer.from(candidateName, 'utf8')],
            this.programId,
        );
        return pda.toBase58();
    }

    private async handleEvent(event: VotingEvent, meta: EventMeta): Promise<void> {
        if (event.name !== 'VoteEvent') return;

        const pollId = event.data.poll_id;
        const candidateName = event.data.candidate;
        const voter = event.data.voter;

        // derive candidate PDA
        const candidateAccount = this.deriveCandidatePda(pollId, candidateName);

        const existing = await this.candidates.findOne({ where: { candidateAccount } });
        if (existing) {
            const current = existing.votes ? BigInt(existing.votes) : 0n;
            const newVotes = (current + 1n).toString();
            await this.candidates.save({
                candidateAccount,
                name: existing.name || candidateName,
                votes: newVotes,
                pollId: existing.pollId ?? pollId,
            });
        } else {
            await this.candidates.save(
                this.candidates.create({
                    candidateAccount,
                    pollId,
                    name: candidateName,
                    votes: '1',
                }),
            );
        }

        await this.votes.save(
            this.votes.create({
                pollId,
                candidateAccount,
                voter,
                tx: meta.tx,
                slot: String(meta.slot),
                blockTime: meta.blockTime,
            }),
        );

        const pollAccount = await this.findPollAccountById(pollId);
        if (pollAccount) {
            const existingPoll = await this.polls.findOne({ where: { pollAccount } });
            if (existingPoll) {
                if (existingPoll.pollId !== pollId) {
                    await this.polls.save({ ...(existingPoll as any), pollId });
                }
            } else {
                await this.polls.save(
                    this.polls.create({
                        pollId,
                        pollAccount,
                        name: '',
                        description: '',
                        start: '0',
                        end: '0',
                        optionIndex: '0',
                    }),
                );
            }
        }
    }

    private async findPollAccountById(pollId: string): Promise<string | null> {
        try {
            const [pda] = PublicKey.findProgramAddressSync(
                [Buffer.from('poll'), writeU64LE(pollId)],
                this.programId,
            );
            return pda.toBase58();
        } catch {
            return null;
        }
    }

    //  Reverse linking helpers

    private async linkCandidateByReversePda(candidateAccount: string): Promise<void> {
        const cand = await this.candidates.findOne({ where: { candidateAccount } });
        if (!cand || cand.pollId || !cand.name) return;

        const knownPolls = await this.polls
            .createQueryBuilder('p')
            .where('p.pollId IS NOT NULL')
            .select(['p.pollId'])
            .getMany();

        for (const p of knownPolls) {
            const pid = (p as any).pollId as string;
            const derived = this.deriveCandidatePda(pid, cand.name);
            if (derived === candidateAccount) {
                await this.candidates.save({ candidateAccount, pollId: pid });
                return;
            }
        }
    }

    private async linkAllCandidatesByReversePda(): Promise<void> {
        const unknown = await this.candidates
            .createQueryBuilder('c')
            .where('c.pollId IS NULL')
            .getMany();

        if (unknown.length === 0) return;

        const knownPolls = await this.polls
            .createQueryBuilder('p')
            .where('p.pollId IS NOT NULL')
            .select(['p.pollId'])
            .getMany();

        for (const cand of unknown) {
            if (!cand.name) continue;
            for (const p of knownPolls) {
                const pid = (p as any).pollId as string;
                const derived = this.deriveCandidatePda(pid, cand.name);
                if (derived === cand.candidateAccount) {
                    await this.candidates.save({ candidateAccount: cand.candidateAccount, pollId: pid });
                    this.log.log(`Linked candidate ${cand.candidateAccount} -> pollId ${pid} (reverse PDA)`);
                    break;
                }
            }
        }
    }
}
