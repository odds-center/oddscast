import { Module } from '@nestjs/common';
import { PredictionTicketsController } from './prediction-tickets.controller';
import { PredictionTicketsService } from './prediction-tickets.service';

@Module({
  controllers: [PredictionTicketsController],
  providers: [PredictionTicketsService],
})
export class PredictionTicketsModule {}
