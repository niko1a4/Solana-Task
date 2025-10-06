import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Poll } from './poll.entity';
import { Candidate } from 'src/candidates/candidate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Poll, Candidate])],
  controllers: [PollsController],
  providers: [PollsService]
})
export class PollsModule { }
