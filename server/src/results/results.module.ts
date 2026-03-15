import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Race } from '../database/entities/race.entity';
import { RaceResult } from '../database/entities/race-result.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { PredictionsModule } from '../predictions/predictions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Race, RaceResult, Prediction]),
    PredictionsModule,
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}
