export type PollStatus = 'PENDING' | 'ACTIVE' | 'FINISHED' | string;

export interface PollListItem {
    pollId: string;
    name: string;
    description: string;
    start: number | null;      // sec ili ms (javi mi šta šalješ)
    end: number | null;
    status: PollStatus;
    totalVotes: number;
}

export interface CandidateItem {
    id?: string;               // base58 adresa kandidata (ako je vraća backend)
    name: string;
    votes: number;
}

export interface PollDetail {
    pollId: string;
    name: string;
    description: string;
    start: number | null;
    end: number | null;
    status: PollStatus;
    candidates: CandidateItem[];
}

export interface LeaderboardEntry {
    name: string;
    votes: number;
}
