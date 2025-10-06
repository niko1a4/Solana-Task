import { useQuery } from '@tanstack/react-query';
import { fetchPolls } from '../api/polls';
import Loading from '../components/Loading';
import ErrorState from '../components/ErrorState';
import PollCard from '../components/PollCard';
import { PollListItem } from '../api/types';

// --- type guards & normalizer ---
function isPollArray(d: any): d is PollListItem[] {
    return Array.isArray(d) && d.every(x => x && typeof x === 'object' && 'pollId' in x && 'status' in x);
}
function isPollsEnvelope(d: any): d is { polls: PollListItem[] } {
    return d && typeof d === 'object' && Array.isArray((d as any).polls);
}
function normalizePolls(data: unknown): PollListItem[] {
    if (isPollArray(data)) return data;
    if (isPollsEnvelope(data)) return data.polls;
    return [];
}

export default function PollsList() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['polls'],
        queryFn: fetchPolls,
        refetchInterval: 5000,
    });

    if (isLoading) return <Loading />;
    if (isError) return <ErrorState />;

    const polls = normalizePolls(data);

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <h1 className="text-2xl font-bold">Polls</h1>

            {polls.length === 0 ? (
                <p className="mt-4 text-gray-500">No polls available.</p>
            ) : (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {polls.map((p, i) => (
                        <PollCard key={p.pollId ?? i} p={p} />
                    ))}
                </div>
            )}
        </div>
    );
}
