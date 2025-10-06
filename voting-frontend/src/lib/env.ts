export type SolanaCluster = 'devnet' | 'testnet' | 'mainnet-beta';

export const ENV = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
    SOLANA_CLUSTER: (import.meta.env.VITE_SOLANA_CLUSTER as SolanaCluster) || 'devnet',
    SOLANA_RPC_URL: (import.meta.env.VITE_SOLANA_RPC_URL as string) || undefined,
    PROGRAM_ID: import.meta.env.VITE_PROGRAM_ID as string | undefined,
};

if (!ENV.API_BASE_URL) console.warn('VITE_API_BASE_URL is not set.');
