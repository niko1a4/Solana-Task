import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Vote } from './vote.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VotesService {
    constructor(@InjectRepository(Vote) private readonly votes: Repository<Vote>) { }

    //all votes for one poll
    async findByPoll(pollId: string): Promise<Vote[]> {
        return this.votes.find({
            where: { pollId },
            order: { slot: 'ASC' }
        });
    }

    async findStats(pollId: string): Promise<{ candidate: string; count: number }[]> {
        return this.votes
            .createQueryBuilder('v')
            .select('v.candidate', 'candidate')
            .addSelect('COUNT(*)', 'count')
            .where('v.pollId = :pollId', { pollId })
            .groupBy('v.candidate')
            .orderBy('count', 'DESC')
            .getRawMany();
    }
    //all votes from single voter in poll
    async findByVoter(pollId: string, voter: string): Promise<Vote[]> {
        return this.votes.find({
            where: { pollId, voter },
            order: { slot: 'ASC' },
        });
    }
}
