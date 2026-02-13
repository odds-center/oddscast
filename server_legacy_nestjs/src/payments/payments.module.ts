import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { TossPaymentService } from './toss.service';
import { BillingHistory } from './entities/billing-history.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { PredictionTicket } from '../prediction-tickets/entities/prediction-ticket.entity';
import { User } from '../users/entities/user.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PredictionTicketsModule } from '../prediction-tickets/prediction-tickets.module';

/**
 * 결제 모듈 (Toss Payments)
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      BillingHistory,
      Subscription,
      PredictionTicket,
      User,
    ]),
    SubscriptionsModule,
    PredictionTicketsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, TossPaymentService],
  exports: [PaymentsService, TossPaymentService],
})
export class PaymentsModule {}
