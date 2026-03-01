import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RaceResult } from '../database/entities/race-result.entity';
import { JockeysController } from './jockeys.controller';
import { JockeysService } from './jockeys.service';

@Module({
  imports: [TypeOrmModule.forFeature([RaceResult])],
  controllers: [JockeysController],
  providers: [JockeysService],
  exports: [JockeysService],
})
export class JockeysModule {}
