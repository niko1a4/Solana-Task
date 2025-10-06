import { Controller, Get, Param } from '@nestjs/common';
import { PollsService } from './polls.service';

@Controller('polls')
export class PollsController {
    constructor(private readonly pollsService: PollsService) { }

    @Get()
    list() {
        return this.pollsService.findAll();
    }

    @Get(':pollId')
    findOne(@Param('pollId') pollId: string) {
        return this.pollsService.findOne(pollId);
    }

    @Get(':pollId/leaderboard')
    leaderboard(@Param('pollId') pollId: string) {
        return this.pollsService.getLeaderBoard(pollId);
    }
}
