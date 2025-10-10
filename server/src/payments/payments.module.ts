import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { TossPaymentService } from './services/toss-payment.service';
import { PaymentWebhookService } from './services/payment-webhook.service';
import { Payment } from './entities/payment.entity';
import { BillingKey } from './entities/billing-key.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SinglePurchasesModule } from '../single-purchases/single-purchases.module';

/**
 * 결제 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, BillingKey]),
    ConfigModule,
    SubscriptionsModule,
    SinglePurchasesModule,
  ],
  controllers: [PaymentsController],
  providers: [TossPaymentService, PaymentWebhookService],
  exports: [TossPaymentService],
})
export class PaymentsModule {}
