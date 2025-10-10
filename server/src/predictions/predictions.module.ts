import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';
import { Prediction } from './entities/prediction.entity';
import { Race } from '../races/entities/race.entity';
import { EntryDetail } from '../races/entities/entry-detail.entity';
import { LlmModule } from '../llm/llm.module';

/**
 * 예측 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Prediction, Race, EntryDetail]),
    LlmModule,
  ],
  controllers: [PredictionsController],
  providers: [PredictionsService],
  exports: [PredictionsService],
})
export class PredictionsModule {}
