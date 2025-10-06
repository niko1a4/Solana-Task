import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { fetchLeaderboard } from '../api/polls';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';

export default function Leaderboard() {
    const { pollId } = useParams<{ pollId: string }>();

    const { data, isLoading, isError } = useQuery({
        queryKey: ['leaderboard', pollId],
        queryFn: () => fetchLeaderboard(pollId!),
        enabled: !!pollId,
        refetchInterval: 5000,
    });

    if (isLoading) return <Loading />;
    if (isError || !data) return <ErrorState />;

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Leaderboard</h1>
                <Link to={`/polls/${pollId}`} className="text-sm underline">← Back to poll</Link>
            </div>

            <div className="mt-6 overflow-x-auto rounded-2xl border bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="text-left px-4 py-3">Rank</th>
                            <th className="text-left px-4 py-3">Candidate</th>
                            <th className="text-right px-4 py-3">Votes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={`${row.name}-${i}`} className="border-t">
                                <td className="px-4 py-3">{i + 1}</td>
                                <td className="px-4 py-3">{row.name}</td>
                                <td className="px-4 py-3 text-right">{row.votes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
