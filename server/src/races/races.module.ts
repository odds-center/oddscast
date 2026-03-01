import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { RacesService } from './races.service';
import { RacesController } from './races.controller';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Race, RaceEntry, RaceResult, Prediction]),
    CacheModule,
  ],
  controllers: [RacesController],
  providers: [RacesService],
  exports: [RacesService],
})
export class RacesModule {}
