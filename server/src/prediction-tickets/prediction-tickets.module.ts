import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { Race } from '../database/entities/race.entity';
import { PredictionTicketsController } from './prediction-tickets.controller';
import { PredictionTicketsService } from './prediction-tickets.service';
import { PredictionsModule } from '../predictions/predictions.module';
import { GlobalConfigModule } from '../config/config.module';
import { KraModule } from '../kra/kra.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PredictionTicket, Prediction, Race]),
    PredictionsModule,
    GlobalConfigModule,
    KraModule,
  ],
  controllers: [PredictionTicketsController],
  providers: [PredictionTicketsService],
  exports: [PredictionTicketsService],
})
export class PredictionTicketsModule {}
