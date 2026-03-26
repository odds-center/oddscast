import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { JockeyResult } from '../database/entities/jockey-result.entity';
import { TrainerResult } from '../database/entities/trainer-result.entity';
import { RaceAnalysisCache } from '../database/entities/race-analysis-cache.entity';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Race,
      RaceEntry,
      RaceResult,
      JockeyResult,
      TrainerResult,
      RaceAnalysisCache,
    ]),
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
