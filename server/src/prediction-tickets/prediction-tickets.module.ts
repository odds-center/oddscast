import { Module } from '@nestjs/common';
import { PredictionTicketsController } from './prediction-tickets.controller';
import { PredictionTicketsService } from './prediction-tickets.service';
import { PredictionsModule } from '../predictions/predictions.module';

@Module({
  imports: [PredictionsModule],
  controllers: [PredictionTicketsController],
  providers: [PredictionTicketsService],
  exports: [PredictionTicketsService],
})
export class PredictionTicketsModule {}
