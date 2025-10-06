import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Poll } from './poll.entity';
import { Candidate } from 'src/candidates/candidate.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PollsService {
    constructor(
        @InjectRepository(Poll) private readonly polls: Repository<Poll>,
        @InjectRepository(Candidate) private readonly candidates: Repository<Candidate>,
    ) { }

    async findAll() {
        const items = await this.polls.find({ relations: ['candidates'] });
        return items.map((p) => ({
            pollId: p.pollId,                // u64 seed (string)
            pollAccount: p.pollAccount,      // PDA pubkey
            name: p.name,
            description: p.description,
            start: p.start,
            end: p.end,
            status: this.statusOf(p),
            totalVotes: p.candidates.reduce((s, c) => s + Number(c.votes), 0),
        }));
    }

    async findOne(pollId: string) {
        const poll = await this.polls.findOne({
            where: { pollId },
            relations: ['candidates'],
        });
        if (!poll) throw new NotFoundException('Poll not found');

        return {
            pollId: poll.pollId,
            pollAccount: poll.pollAccount,
            name: poll.name,
            description: poll.description,
            start: poll.start,
            end: poll.end,
            status: this.statusOf(poll),
            candidates: poll.candidates.map((c) => ({
                candidateAccount: c.candidateAccount,
                name: c.name,
                votes: Number(c.votes),
            })),
            totalVotes: poll.candidates.reduce((s, c) => s + Number(c.votes), 0),
        };
    }

    async getLeaderBoard(pollId: string) {
        const candidates = await this.candidates.find({ where: { pollId } });
        return candidates
            .sort((a, b) => Number(b.votes) - Number(a.votes))
            .map((c) => ({
                candidateAccount: c.candidateAccount,
                name: c.name,
                votes: Number(c.votes),
            }));
    }

    private statusOf(p: Poll): 'UPCOMING' | 'ACTIVE' | 'ENDED' {
        const now = Math.floor(Date.now() / 1000);
        const start = Number(p.start);
        const end = Number(p.end);
        if (now < start) return 'UPCOMING';
        if (now >= start && now <= end) return 'ACTIVE';
        return 'ENDED';
    }
}
