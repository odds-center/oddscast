import { Module } from '@nestjs/common';
import { KraApiService } from './kra-api.service';
import { KraApiController } from './kra-api.controller';
import { KraSchedulerService } from './kra-scheduler.service';
import { KraDividendService } from './services/kra-dividend.service';
import { KraRaceRecordsService } from './services/kra-race-records.service';
import { KraRacePlansService } from './services/kra-race-plans.service';

@Module({
  providers: [
    KraApiService,
    KraSchedulerService,
    KraDividendService,
    KraRaceRecordsService,
    KraRacePlansService,
  ],
  controllers: [KraApiController],
  exports: [
    KraApiService,
    KraSchedulerService,
    KraDividendService,
    KraRaceRecordsService,
    KraRacePlansService,
  ],
})
export class KraApiModule {}
