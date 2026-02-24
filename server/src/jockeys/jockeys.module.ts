import { Module } from '@nestjs/common';
import { JockeysController } from './jockeys.controller';
import { JockeysService } from './jockeys.service';

@Module({
  controllers: [JockeysController],
  providers: [JockeysService],
  exports: [JockeysService],
})
export class JockeysModule {}
