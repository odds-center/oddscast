import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RaceResult } from '../database/entities/race-result.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { Race } from '../database/entities/race.entity';
import { HorsesController } from './horses.controller';
import { HorsesService } from './horses.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RaceResult, RaceEntry, Race]),
  ],
  controllers: [HorsesController],
  providers: [HorsesService],
  exports: [HorsesService],
})
export class HorsesModule {}
