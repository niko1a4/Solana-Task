import { Link, NavLink } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Navbar() {
    const linkBase = 'px-3 py-2 rounded hover:bg-gray-100 transition';
    const active = 'bg-gray-200';

    return (
        <header className="border-b bg-white">
            <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-3">
                <Link to="/" className="font-semibold">Voting dApp</Link>
                <nav className="flex items-center gap-2">
                    <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? active : ''}`}>Polls</NavLink>
                    <WalletMultiButton />
                </nav>
            </div>
        </header>
    );
}
