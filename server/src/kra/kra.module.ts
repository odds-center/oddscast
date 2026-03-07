import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { Training } from '../database/entities/training.entity';
import { JockeyResult } from '../database/entities/jockey-result.entity';
import { TrainerResult } from '../database/entities/trainer-result.entity';
import { KraSyncLog } from '../database/entities/kra-sync-log.entity';
import { BatchSchedule } from '../database/entities/batch-schedule.entity';
import { RaceDividend } from '../database/entities/race-dividend.entity';
import { KraService } from './kra.service';
import { KraController } from './kra.controller';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '../cache/cache.module';
import { GlobalConfigModule } from '../config/config.module';
import { ResultsModule } from '../results/results.module';
import { PredictionsModule } from '../predictions/predictions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Race,
      RaceEntry,
      RaceResult,
      Training,
      JockeyResult,
      TrainerResult,
      KraSyncLog,
      BatchSchedule,
      RaceDividend,
    ]),
    HttpModule,
    ScheduleModule.forRoot(),
    ConfigModule,
    CacheModule,
    GlobalConfigModule,
    ResultsModule,
    PredictionsModule,
  ],
  controllers: [KraController],
  providers: [KraService],
  exports: [KraService],
})
export class KraModule {}
