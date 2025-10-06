import { getConnection, coder, ACCOUNT_NAMES } from './anchorClient';
import { PublicKey } from '@solana/web3.js';

export async function decodeAccount<T = any>(accountName: string, address: string) {
    const conn = getConnection();
    const pubkey = new PublicKey(address);
    const info = await conn.getAccountInfo(pubkey);
    if (!info?.data) throw new Error(`No account data for ${address}`);
    const decoded = coder.accounts.decode(accountName, info.data) as T;
    return decoded;
}


export async function readCandidateAccount(address: string) {
    return decodeAccount(ACCOUNT_NAMES.candidate, address) as Promise<{
        candidate_name: string;
        candidate_votes: bigint | number;
    }>;
}
