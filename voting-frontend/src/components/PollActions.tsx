import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3, BN, Idl } from '@coral-xyz/anchor';
import idl from '../solana/idl/voting.json';
import { useState, useEffect } from 'react';

const { PublicKey, SystemProgram, Connection } = web3;


const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL!;
const PROGRAM_ID = new PublicKey(import.meta.env.VITE_PROGRAM_ID!);

type Poll = {
    pollId: string;       // u64 as string
    pollAccount: string;  // PDA pubkey
    name: string;
};

export default function PollActions() {
    const wallet = useAnchorWallet();

    const [loading, setLoading] = useState(false);
    const [polls, setPolls] = useState<Poll[]>([]);
    const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
    const [candidateName, setCandidateName] = useState('');
    const [voteCandidateName, setVoteCandidateName] = useState('');

    //  fetch polls
    useEffect(() => {
        async function fetchPolls() {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/polls`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setPolls(data);
                }
            } catch (err) {
                console.error('Failed to fetch polls:', err);
            }
        }
        fetchPolls();
    }, []);

    const getProgram = () => {
        if (!wallet) throw new Error("Wallet not ready");

        const connection = new Connection(RPC_URL, 'confirmed');
        const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
        return new Program(idl as Idl, provider);
    };

    // create poll 
    const createPoll = async () => {
        if (!wallet) return alert('Connect wallet first!');
        setLoading(true);
        try {
            const program = getProgram();
            const connection = new Connection(RPC_URL, 'confirmed');

            // Poll ID and chain time
            const newPollId = Math.floor(Date.now() / 1000);
            const slot = await connection.getSlot();
            const chainTime = await connection.getBlockTime(slot);
            const startTime = (chainTime ?? Math.floor(Date.now() / 1000)) + 5;
            const endTime = startTime + 3600;

            const [pollPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('poll'), new BN(newPollId).toArrayLike(Buffer, 'le', 8)],
                PROGRAM_ID
            );

            const tx = await program.methods
                .initializePoll(
                    new BN(newPollId),
                    new BN(startTime),
                    new BN(endTime),
                    'Demo Poll',
                    'Poll description'
                )
                .accounts({
                    signer: wallet.publicKey,
                    pollAccount: pollPda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();
            alert(`Poll created with ID ${newPollId}! Tx: ${tx}`);
        } catch (e: any) {
            console.error('Poll error:', e);
            if (e.logs) console.error('Transaction logs:', e.logs);
        }
        setLoading(false);
    };

    //  create candidate 
    const createCandidate = async () => {
        if (!wallet) return alert('Connect wallet first!');
        if (!candidateName) return alert('Enter candidate name first!');
        if (!selectedPoll) return alert('Select a poll first!');
        setLoading(true);
        try {
            const program = getProgram();
            const pollIdBN = new BN(Number(selectedPoll.pollId));

            const [candidatePda] = PublicKey.findProgramAddressSync(
                [pollIdBN.toArrayLike(Buffer, 'le', 8), Buffer.from(candidateName)],
                PROGRAM_ID
            );

            await program.methods
                .initializeCandidate(pollIdBN, candidateName)
                .accounts({
                    signer: wallet.publicKey,
                    pollAccount: new PublicKey(selectedPoll.pollAccount),
                    candidateAccount: candidatePda,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            alert(`Candidate (${candidateName}) created in poll ${selectedPoll.pollId}!`);
            setCandidateName('');
        } catch (e: any) {
            console.error('Candidate error:', e);
            if (e.logs) console.error('Transaction logs:', e.logs);
        }
        setLoading(false);
    };

    // vote 
    const vote = async () => {
        if (!wallet) return alert('Connect wallet first!');
        if (!voteCandidateName) return alert('Enter candidate name!');
        if (!selectedPoll) return alert('Select a poll first!');
        setLoading(true);
        try {
            const program = getProgram();
            const pollIdBN = new BN(Number(selectedPoll.pollId));


            const [pollPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("poll"), pollIdBN.toArrayLike(Buffer, "le", 8)],
                PROGRAM_ID
            );


            const [candidatePda] = PublicKey.findProgramAddressSync(
                [pollIdBN.toArrayLike(Buffer, "le", 8), Buffer.from(voteCandidateName)],
                PROGRAM_ID
            );



            const tx = await program.methods
                .vote(pollIdBN, voteCandidateName)
                .accounts({
                    signer: wallet.publicKey,
                    pollAccount: pollPda,
                    candidateAccount: candidatePda,
                })
                .rpc();

            console.log('Vote tx:', tx);
            alert(`Voted for candidate ${voteCandidateName} in poll ${selectedPoll.pollId}!`);
            setVoteCandidateName('');
        } catch (e: any) {
            console.error('Vote error:', e);
            alert(`Vote failed: ${e.message ?? e}`);
            if (e.logs) console.error('Transaction logs:', e.logs);
        }
        setLoading(false);
    };


    return (
        <div style={{ marginTop: 20 }}>
            <h3>Poll Actions</h3>

            {/* Create poll */}
            <div style={{ marginBottom: 20 }}>
                <button disabled={loading} onClick={createPoll}>
                    Create Poll
                </button>
            </div>

            {/* Poll selector */}
            <div style={{ marginBottom: 10 }}>
                <label>Choose Poll: </label>
                <select
                    value={selectedPoll?.pollAccount ?? ''}
                    onChange={(e) => {
                        const p = polls.find(x => x.pollAccount === e.target.value) || null;
                        setSelectedPoll(p);
                    }}
                >
                    <option value="">-- select poll --</option>
                    {polls.map((p) => (
                        <option key={p.pollAccount} value={p.pollAccount}>
                            {p.pollId}: {p.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Show poll account */}
            {selectedPoll && (
                <div style={{ marginBottom: 10 }}>
                    <strong>Poll account:</strong> {selectedPoll.pollAccount}
                </div>
            )}

            {/* Add candidate */}
            <div style={{ marginTop: 10 }}>
                <input
                    type="text"
                    value={candidateName}
                    placeholder="Candidate name"
                    onChange={(e) => setCandidateName(e.target.value)}
                />
                <button onClick={createCandidate} style={{ marginLeft: 10 }}>
                    Add Candidate
                </button>
            </div>

            {/* Vote */}
            <div style={{ marginTop: 10 }}>
                <input
                    type="text"
                    value={voteCandidateName}
                    placeholder="Candidate name"
                    onChange={(e) => setVoteCandidateName(e.target.value)}
                />
                <button
                    disabled={loading}
                    onClick={vote}
                    style={{ marginLeft: 10 }}
                >
                    Vote
                </button>
            </div>
        </div>
    );
}
