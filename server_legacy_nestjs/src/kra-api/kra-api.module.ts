/**
 * KRA API 모듈
 * 한국마사회 API 연동 모듈
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KraApiController } from './kra-api.controller';
import { KraApiIntegratedService } from './kra-api-integrated.service';
import {
  KraRaceRecordsService,
  KraEntrySheetService,
  KraDividendRatesService,
  KraRacePlansService,
} from './services';

@Module({
  imports: [ConfigModule],
  controllers: [KraApiController],
  providers: [
    // 통합 서비스
    KraApiIntegratedService,

    // 개별 서비스들
    KraRaceRecordsService,
    KraEntrySheetService,
    KraDividendRatesService,
    KraRacePlansService,
  ],
  exports: [
    // 다른 모듈에서 사용할 수 있도록 export
    KraApiIntegratedService,
    KraRaceRecordsService,
    KraEntrySheetService,
    KraDividendRatesService,
    KraRacePlansService,
  ],
})
export class KraApiModule {}
