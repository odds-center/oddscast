import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { SinglePurchasesService } from '../../single-purchases/single-purchases.service';

export interface TossWebhookData {
  eventType: string; // PAYMENT_CONFIRMED, PAYMENT_FAILED 등
  createdAt: string;
  data: {
    paymentKey: string;
    orderId: string;
    status: string;
    transactionKey: string;
    amount: number;
    method: string;
  };
}

/**
 * 결제 웹훅 처리 서비스
 */
@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly singlePurchasesService: SinglePurchasesService
  ) {}

  /**
   * Toss Payments 웹훅 처리
   */
  async handleTossWebhook(webhookData: TossWebhookData): Promise<void> {
    this.logger.log(`Webhook received: ${webhookData.eventType}`);

    switch (webhookData.eventType) {
      case 'PAYMENT_CONFIRMED':
        await this.handlePaymentConfirmed(webhookData.data);
        break;

      case 'PAYMENT_FAILED':
        await this.handlePaymentFailed(webhookData.data);
        break;

      case 'PAYMENT_CANCELLED':
        await this.handlePaymentCancelled(webhookData.data);
        break;

      default:
        this.logger.warn(`Unknown webhook event: ${webhookData.eventType}`);
    }
  }

  /**
   * 결제 성공 처리
   */
  private async handlePaymentConfirmed(
    data: TossWebhookData['data']
  ): Promise<void> {
    const payment = await this.paymentRepo.findOne({
      where: { orderId: data.orderId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found: ${data.orderId}`);
      return;
    }

    // 이미 처리된 경우 스킵
    if (payment.status === 'SUCCESS') {
      this.logger.log(`Payment already confirmed: ${payment.id}`);
      return;
    }

    // 결제 승인 처리
    payment.approve(data.paymentKey, data.transactionKey);
    await this.paymentRepo.save(payment);

    this.logger.log(`Payment confirmed via webhook: ${payment.id}`);

    // TODO: 구독/개별 구매 후속 처리 (예측권 발급 등)
  }

  /**
   * 결제 실패 처리
   */
  private async handlePaymentFailed(
    data: TossWebhookData['data']
  ): Promise<void> {
    const payment = await this.paymentRepo.findOne({
      where: { orderId: data.orderId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found: ${data.orderId}`);
      return;
    }

    payment.fail('Payment failed from Toss');
    await this.paymentRepo.save(payment);

    this.logger.log(`Payment failed via webhook: ${payment.id}`);
  }

  /**
   * 결제 취소 처리
   */
  private async handlePaymentCancelled(
    data: TossWebhookData['data']
  ): Promise<void> {
    const payment = await this.paymentRepo.findOne({
      where: { paymentKey: data.paymentKey },
    });

    if (!payment) {
      this.logger.warn(`Payment not found: ${data.paymentKey}`);
      return;
    }

    payment.cancel('Cancelled from Toss');
    await this.paymentRepo.save(payment);

    this.logger.log(`Payment cancelled via webhook: ${payment.id}`);
  }
}
