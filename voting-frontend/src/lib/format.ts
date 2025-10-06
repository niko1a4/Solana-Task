import { formatDistanceToNowStrict, fromUnixTime } from 'date-fns';

// Ako backend šalje sekunde, pozovi sa isSeconds=true
export function formatRelativeTime(timestamp: number, isSeconds = false) {
    const date = isSeconds ? fromUnixTime(timestamp) : new Date(timestamp);
    return formatDistanceToNowStrict(date, { addSuffix: true });
}