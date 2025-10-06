import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../lib/format';
import { PollListItem } from '../api/types';

function safeFormatTime(value: string | number | null | undefined, label: string) {
    if (!value) return `${label}: —`;

    const num = Number(value);
    if (isNaN(num) || num <= 0) return `${label}: —`;

    const date = new Date(num * 1000);
    if (isNaN(date.getTime())) return `${label}: —`;

    return `${label}: ${formatRelativeTime(date.getTime())}`;
}

export default function PollCard({ p }: { p: PollListItem }) {
    return (
        <div className="rounded-2xl border p-4 bg-white shadow-sm hover:shadow transition">
            <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <span className="text-sm text-gray-500">{p.status}</span>
            </div>
            <p className="mt-2 text-sm text-gray-700 line-clamp-3">{p.description}</p>
            <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                <span>Total votes: <b>{p.totalVotes}</b></span>
                <span>
                    {safeFormatTime(p.start, 'Start')}
                    {' · '}
                    {safeFormatTime(p.end, 'End')}
                </span>
            </div>
            <div className="mt-4">
                <Link to={`/polls/${p.pollId}`} className="text-sm font-medium underline">
                    View details →
                </Link>
            </div>
        </div>
    );
}
