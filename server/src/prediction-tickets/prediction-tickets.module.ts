import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictionTicketsController } from './prediction-tickets.controller';
import { PredictionTicketsService } from './prediction-tickets.service';
import { PredictionTicket } from './entities/prediction-ticket.entity';
import { PredictionsModule } from '../predictions/predictions.module';

/**
 * 예측권 모듈
 */
@Module({
  imports: [TypeOrmModule.forFeature([PredictionTicket]), PredictionsModule],
  controllers: [PredictionTicketsController],
  providers: [PredictionTicketsService],
  exports: [PredictionTicketsService],
})
export class PredictionTicketsModule {}
