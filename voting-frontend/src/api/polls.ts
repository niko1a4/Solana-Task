import { api } from './client';
import { PollListItem, PollDetail, LeaderboardEntry } from './types';

export async function fetchPolls(): Promise<PollListItem[]> {
    const { data } = await api.get('/polls');
    return data;
}

export async function fetchPoll(pollId: string): Promise<PollDetail> {
    const { data } = await api.get(`/polls/${pollId}`);
    return data;
}

export async function fetchLeaderboard(pollId: string): Promise<LeaderboardEntry[]> {
    const { data } = await api.get(`/polls/${pollId}/leaderboard`);
    return data;
}
