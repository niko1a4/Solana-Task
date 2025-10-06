import { Controller, Get, Param } from '@nestjs/common';
import { VotesService } from './votes.service';
import { Vote } from './vote.entity';

@Controller('polls/:pollId')
export class VotesController {
    constructor(private readonly voteService: VotesService) { }

    // GET /polls/:pollId/votes
    @Get('votes')
    async getVotes(@Param('pollId') pollId: string): Promise<Vote[]> {
        return this.voteService.findByPoll(pollId);
    }

    // GET /polls/:pollId/vote-stats
    @Get('vote-stats')
    async getVoteStats(@Param('pollId') pollId: string): Promise<{ candidate: string, count: number }[]> {
        return this.voteService.findStats(pollId);
    }


    // GET /polls/:pollId/voters/:voter
    @Get('voters/:voter')
    async getVotesByVoter(@Param('pollId') pollId: string, @Param('voter') voter: string): Promise<Vote[]> {
        return this.voteService.findByVoter(pollId, voter);
    }
}
