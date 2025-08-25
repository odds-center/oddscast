import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceService } from './data-source.service';
import { RacePlan } from '../races/entities/race-plan.entity';
import { RaceHorseResult } from '../results/entities/race-horse-result.entity';
import { DividendRate } from '../results/entities/dividend-rate.entity';
import { EntryDetail } from '../races/entities/entry-detail.entity';
import { KraApiModule } from '../external-apis/kra/kra-api.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RacePlan,
      RaceHorseResult,
      DividendRate,
      EntryDetail,
    ]),
    KraApiModule,
  ],
  providers: [DataSourceService],
  exports: [DataSourceService],
})
export class DataSourceModule {}
