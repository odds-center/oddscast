import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';
import { RacePlan } from '../races/entities/race-plan.entity';
import { Race } from '../races/entities/race.entity';
import { RaceHorseResult } from '../results/entities/race-horse-result.entity';
import { DividendRate } from '../results/entities/dividend-rate.entity';
import { EntryDetail } from '../races/entities/entry-detail.entity';
import { KraApiModule } from '../external-apis/kra/kra-api.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RacePlan,
      Race,
      RaceHorseResult,
      DividendRate,
      EntryDetail,
    ]),
    KraApiModule,
  ],
  providers: [BatchService],
  controllers: [BatchController],
  exports: [BatchService],
})
export class BatchModule {}
