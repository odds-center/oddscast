import { Module } from '@nestjs/common';
import { HorsesController } from './horses.controller';
import { HorsesService } from './horses.service';

@Module({
  controllers: [HorsesController],
  providers: [HorsesService],
  exports: [HorsesService],
})
export class HorsesModule {}
