import { Module } from '@nestjs/common';
import { KraApiService } from './kra-api.service';
import { KraApiController } from './kra-api.controller';
import { KraSchedulerService } from './kra-scheduler.service';

@Module({
  providers: [KraApiService, KraSchedulerService],
  controllers: [KraApiController],
  exports: [KraApiService, KraSchedulerService],
})
export class KraApiModule {}
