import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPoll } from '../api/polls';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import { readCandidateAccount } from '../solana/onchain';

type OnchainCandidate = {
    address: string;
    candidate_votes?: number | bigint;
    error?: string;
};

export default function PollDetails() {
    const { pollId } = useParams<{ pollId: string }>();

    const pollQ = useQuery({
        queryKey: ['poll', pollId],
        queryFn: () => fetchPoll(pollId!),
        enabled: !!pollId,
        refetchInterval: 5000,
    });


    const onchainQ = useQuery({
        queryKey: ['poll-onchain', pollId, pollQ.data?.candidates],
        enabled: !!pollQ.data && pollQ.data.candidates.some(c => !!c.id),
        queryFn: async () => {
            const results: OnchainCandidate[] = [];
            for (const c of pollQ.data!.candidates) {
                if (!c.id) continue;
                try {
                    const dec = await readCandidateAccount(c.id);

                    const votes = (dec as any).candidate_votes;
                    results.push({ address: c.id, candidate_votes: votes });
                } catch (e: any) {
                    results.push({ address: c.id, error: e?.message || 'decode failed' });
                }
            }
            return results;
        },
        refetchInterval: 5000,
    });

    if (pollQ.isLoading) return <Loading />;
    if (pollQ.isError || !pollQ.data) return <ErrorState />;

    const data = pollQ.data;
    const totalVotes = data.candidates.reduce((acc, c) => acc + (c.votes ?? 0), 0);
    const onchainMap = new Map(onchainQ.data?.map(o => [o.address, o]) || []);

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{data.name}</h1>
                <Link to={`/polls/${data.pollId}/leaderboard`} className="text-sm underline">
                    Leaderboard →
                </Link>
            </div>

            <p className="mt-2 text-gray-700">{data.description}</p>

            <div className="mt-6 overflow-x-auto rounded-2xl border bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="text-left px-4 py-3">#</th>
                            <th className="text-left px-4 py-3">Candidate</th>
                            <th className="text-right px-4 py-3">Backend Votes</th>
                            <th className="text-right px-4 py-3">On-chain Votes</th>
                            <th className="text-right px-4 py-3">Share</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.candidates.map((c, i) => {
                            const share = totalVotes ? ((c.votes / totalVotes) * 100).toFixed(1) + '%' : '—';
                            const oc = c.id ? onchainMap.get(c.id) : undefined;
                            const ocVotes =
                                (typeof oc?.candidate_votes === 'bigint')
                                    ? Number(oc.candidate_votes)
                                    : (oc?.candidate_votes ?? '—');

                            const mismatch = typeof ocVotes === 'number' && ocVotes !== c.votes;

                            return (
                                <tr key={`${c.name}-${i}`} className="border-t align-top">
                                    <td className="px-4 py-3">{i + 1}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{c.name}</div>
                                        {c.id && <div className="text-[11px] text-gray-500 mt-1">{c.id}</div>}
                                        {oc?.error && <div className="text-[11px] text-red-600 mt-1">On-chain read error: {oc.error}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-right">{c.votes}</td>
                                    <td className={`px-4 py-3 text-right ${mismatch ? 'text-amber-600 font-semibold' : ''}`}>
                                        {ocVotes}
                                    </td>
                                    <td className="px-4 py-3 text-right">{share}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t bg-gray-50">
                            <td className="px-4 py-3 font-medium" colSpan={2}>Total</td>
                            <td className="px-4 py-3 text-right font-medium">{totalVotes}</td>
                            <td className="px-4 py-3 text-right">—</td>
                            <td className="px-4 py-3 text-right">100%</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {onchainQ.isLoading && <div className="text-xs text-gray-500 mt-2">Syncing on-chain…</div>}
        </div>
    );
}
