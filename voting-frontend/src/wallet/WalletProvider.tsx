import { ReactNode, useMemo } from 'react';
import { clusterApiUrl } from '@solana/web3.js';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ENV } from '../lib/env';
import '@solana/wallet-adapter-react-ui/styles.css';

function toWalletNetwork(s: 'devnet' | 'testnet' | 'mainnet-beta'): WalletAdapterNetwork {
    switch (s) {
        case 'devnet': return WalletAdapterNetwork.Devnet;
        case 'testnet': return WalletAdapterNetwork.Testnet;
        default: return WalletAdapterNetwork.Mainnet; // 'mainnet-beta'
    }
}

export function AppWalletProvider({ children }: { children: ReactNode }) {
    const endpoint = ENV.SOLANA_RPC_URL || clusterApiUrl(ENV.SOLANA_CLUSTER);
    const network = toWalletNetwork(ENV.SOLANA_CLUSTER);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}
