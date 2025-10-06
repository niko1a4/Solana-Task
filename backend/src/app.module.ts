import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PollsModule } from './polls/polls.module';
import { CandidatesModule } from './candidates/candidates.module';
import { IndexerModule } from './indexer/indexer.module';
import { VotesModule } from './votes/votes.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }),
    PollsModule,
    CandidatesModule,
    IndexerModule,
    VotesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
