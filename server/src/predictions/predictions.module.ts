import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prediction } from '../database/entities/prediction.entity';
import { Race } from '../database/entities/race.entity';
import { RaceEntry } from '../database/entities/race-entry.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { TrainerResult } from '../database/entities/trainer-result.entity';
import { JockeyResult } from '../database/entities/jockey-result.entity';
import { Training } from '../database/entities/training.entity';
import { RaceDividend } from '../database/entities/race-dividend.entity';
import { PredictionsService } from './predictions.service';
import { PredictionsController } from './predictions.controller';
import { PredictionsScheduler } from './predictions.scheduler';
import { AnalysisModule } from '../analysis/analysis.module';
import { GlobalConfigModule } from '../config/config.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Prediction,
      Race,
      RaceEntry,
      RaceResult,
      TrainerResult,
      JockeyResult,
      Training,
      RaceDividend,
    ]),
    AnalysisModule,
    GlobalConfigModule,
    NotificationsModule,
  ],
  controllers: [PredictionsController],
  providers: [PredictionsService, PredictionsScheduler],
  exports: [PredictionsService],
})
export class PredictionsModule {}
