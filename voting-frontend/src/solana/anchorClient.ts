import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { BorshCoder, Idl } from '@coral-xyz/anchor';
import { ENV } from '../lib/env';
import idl from './idl/voting.json';

export function getConnection(): Connection {
    const endpoint = ENV.SOLANA_RPC_URL || clusterApiUrl(ENV.SOLANA_CLUSTER);
    return new Connection(endpoint, 'confirmed');
}

export const PROGRAM_ID = ENV.PROGRAM_ID ? new PublicKey(ENV.PROGRAM_ID) : undefined;


export const coder = new BorshCoder(idl as Idl);


export const ACCOUNT_NAMES = {
    candidate: 'CandidateAccount',
    // poll: 'PollAccount',        
};
