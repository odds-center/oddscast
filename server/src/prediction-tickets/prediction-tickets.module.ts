import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { PredictionTicketsController } from './prediction-tickets.controller';
import { PredictionTicketsService } from './prediction-tickets.service';
import { PredictionsModule } from '../predictions/predictions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PredictionTicket, Prediction]),
    PredictionsModule,
  ],
  controllers: [PredictionTicketsController],
  providers: [PredictionTicketsService],
  exports: [PredictionTicketsService],
})
export class PredictionTicketsModule {}
