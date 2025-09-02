import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';
import { KraDataSchedulerService } from './kra-data-scheduler.service';
import { KraDataBatchController } from './kra-data-batch.controller';
import { RacePlan } from '../races/entities/race-plan.entity';
import { Race } from '../races/entities/race.entity';
import { RaceHorseResult } from '../results/entities/race-horse-result.entity';
import { DividendRate } from '../results/entities/dividend-rate.entity';
import { EntryDetail } from '../races/entities/entry-detail.entity';
import { Result } from '../results/entities/result.entity';
import { KraApiModule } from '../external-apis/kra/kra-api.module';
import { ResultsModule } from '../results/results.module';
import { RacesModule } from '../races/races.module';
import { RacePlansModule } from '../race-plans/race-plans.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      RacePlan,
      Race,
      RaceHorseResult,
      DividendRate,
      EntryDetail,
      Result,
    ]),
    KraApiModule,
    ResultsModule,
    RacesModule,
    RacePlansModule,
  ],
  providers: [BatchService, KraDataSchedulerService],
  controllers: [BatchController, KraDataBatchController],
  exports: [BatchService, KraDataSchedulerService],
})
export class BatchModule {}
