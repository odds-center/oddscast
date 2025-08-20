import { Module } from '@nestjs/common';
import { KraApiService } from './kra-api.service';
import { KraApiController } from './kra-api.controller';

@Module({
  providers: [KraApiService],
  controllers: [KraApiController],
  exports: [KraApiService],
})
export class KraApiModule {}
