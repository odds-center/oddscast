import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Race } from '../database/entities/race.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { PredictionsModule } from '../predictions/predictions.module';
import { CommunityPredictionsModule } from '../community-predictions/community-predictions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Race, RaceResult, Prediction]),
    PredictionsModule,
    CommunityPredictionsModule,
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
