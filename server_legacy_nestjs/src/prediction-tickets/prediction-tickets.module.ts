import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictionTicketsController } from './prediction-tickets.controller';
import { PredictionTicketsService } from './prediction-tickets.service';
import { TicketExpiryService } from './ticket-expiry.service';
import { PredictionTicket } from './entities/prediction-ticket.entity';
import { PredictionsModule } from '../predictions/predictions.module';

/**
 * 예측권 모듈 (만료 Cron 추가)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PredictionTicket]),
    forwardRef(() => PredictionsModule), // 순환 참조 방지
  ],
  controllers: [PredictionTicketsController],
  providers: [PredictionTicketsService, TicketExpiryService],
  exports: [PredictionTicketsService],
})
export class PredictionTicketsModule {}
