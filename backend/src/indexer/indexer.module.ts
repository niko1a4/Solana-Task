import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Poll } from 'src/polls/poll.entity';
import { Candidate } from 'src/candidates/candidate.entity';
import { Vote } from 'src/votes/vote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Poll, Candidate, Vote])],
  providers: [IndexerService]
})
export class IndexerModule { }
