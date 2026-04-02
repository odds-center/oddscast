import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefundRequest } from '../database/entities/refund-request.entity';
import { BillingHistory } from '../database/entities/billing-history.entity';
import { Subscription } from '../database/entities/subscription.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './refunds.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RefundRequest,
      BillingHistory,
      Subscription,
      PredictionTicket,
    ]),
  ],
  controllers: [RefundsController],
  providers: [RefundsService],
  exports: [RefundsService],
})
export class RefundsModule {}
