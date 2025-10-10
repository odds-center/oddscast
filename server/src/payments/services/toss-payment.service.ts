import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { BillingKey } from '../entities/billing-key.entity';
import {
  ConfirmPaymentDto,
  IssueBillingKeyDto,
  BillingPaymentDto,
  CancelPaymentDto,
} from '../dto';

/**
 * Toss Payments 서비스
 */
@Injectable()
export class TossPaymentService {
  private readonly logger = new Logger(TossPaymentService.name);
  private readonly baseUrl = 'https://api.tosspayments.com/v1';
  private readonly secretKey: string;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(BillingKey)
    private readonly billingKeyRepo: Repository<BillingKey>,
    private readonly configService: ConfigService
  ) {
    this.secretKey = this.configService.get<string>('TOSS_SECRET_KEY') || '';

    if (!this.secretKey) {
      this.logger.warn('TOSS_SECRET_KEY not configured');
    }
  }

  /**
   * 결제 승인 (즉시 결제)
   */
  async confirmPayment(
    userId: string,
    dto: ConfirmPaymentDto
  ): Promise<Payment> {
    this.logger.log(`Confirming payment: ${dto.orderId}`);

    try {
      // Toss API 호출
      const response = await axios.post(
        `${this.baseUrl}/payments/confirm`,
        {
          paymentKey: dto.paymentKey,
          orderId: dto.orderId,
          amount: dto.amount,
        },
        {
          headers: {
            Authorization: `Basic ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      // 결제 저장
      const payment = this.paymentRepo.create({
        userId,
        orderId: dto.orderId,
        orderName: data.orderName || '예측권 구매',
        amount: dto.amount,
        paymentMethod: data.method,
        paymentKey: dto.paymentKey,
        pgTransactionId: data.transactionKey,
        receiptUrl: data.receipt?.url,
        status: PaymentStatus.SUCCESS,
        metadata: data,
      });

      const saved = await this.paymentRepo.save(payment);

      this.logger.log(`Payment confirmed: ${saved.id}, ₩${saved.amount}`);

      return saved;
    } catch (error) {
      this.logger.error(`Payment confirmation failed: ${error.message}`);

      // 실패 내역 저장
      const failedPayment = this.paymentRepo.create({
        userId,
        orderId: dto.orderId,
        orderName: '결제 실패',
        amount: dto.amount,
        status: PaymentStatus.FAILED,
        cancelReason: error.response?.data?.message || error.message,
      });

      await this.paymentRepo.save(failedPayment);

      throw new BadRequestException(
        error.response?.data?.message || 'Payment confirmation failed'
      );
    }
  }

  /**
   * 빌링키 발급 (정기 결제용)
   */
  async issueBillingKey(
    userId: string,
    dto: IssueBillingKeyDto
  ): Promise<BillingKey> {
    this.logger.log(`Issuing billing key for user: ${userId}`);

    try {
      const response = await axios.post(
        `${this.baseUrl}/billing/authorizations/issue`,
        {
          customerKey: dto.customerKey,
          authKey: dto.authKey,
        },
        {
          headers: {
            Authorization: `Basic ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      // 빌링키 저장
      const billingKey = this.billingKeyRepo.create({
        userId,
        billingKey: data.billingKey,
        customerKey: dto.customerKey,
        cardNumber: data.card?.number,
        cardCompany: data.card?.company,
        cardType: data.card?.cardType,
        isActive: true,
      });

      const saved = await this.billingKeyRepo.save(billingKey);

      this.logger.log(`Billing key issued: ${saved.id}`);

      return saved;
    } catch (error) {
      this.logger.error(`Billing key issuance failed: ${error.message}`);
      throw new BadRequestException(
        error.response?.data?.message || 'Billing key issuance failed'
      );
    }
  }

  /**
   * 빌링키로 결제 (정기 결제 실행)
   */
  async payWithBillingKey(
    userId: string,
    billingKey: string,
    amount: number,
    orderName: string
  ): Promise<Payment> {
    this.logger.log(`Paying with billing key: ₩${amount}`);

    try {
      const orderId = `order_${Date.now()}_${userId.slice(0, 8)}`;

      const response = await axios.post(
        `${this.baseUrl}/billing/${billingKey}`,
        {
          customerKey: userId,
          amount,
          orderId,
          orderName,
        },
        {
          headers: {
            Authorization: `Basic ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      // 결제 저장
      const payment = this.paymentRepo.create({
        userId,
        orderId,
        orderName,
        amount,
        paymentMethod: data.method,
        pgTransactionId: data.transactionKey,
        receiptUrl: data.receipt?.url,
        status: PaymentStatus.SUCCESS,
        metadata: data,
      });

      const saved = await this.paymentRepo.save(payment);

      this.logger.log(
        `Billing payment successful: ${saved.id}, ₩${saved.amount}`
      );

      return saved;
    } catch (error) {
      this.logger.error(`Billing payment failed: ${error.message}`);
      throw new BadRequestException(
        error.response?.data?.message || 'Billing payment failed'
      );
    }
  }

  /**
   * 결제 취소
   */
  async cancelPayment(dto: CancelPaymentDto): Promise<Payment> {
    this.logger.log(`Cancelling payment: ${dto.paymentKey}`);

    try {
      const response = await axios.post(
        `${this.baseUrl}/payments/${dto.paymentKey}/cancel`,
        {
          cancelReason: dto.cancelReason,
          cancelAmount: dto.cancelAmount,
        },
        {
          headers: {
            Authorization: `Basic ${this.getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      // 결제 조회 후 취소 처리
      const payment = await this.paymentRepo.findOne({
        where: { paymentKey: dto.paymentKey },
      });

      if (!payment) {
        throw new BadRequestException('Payment not found');
      }

      payment.cancel(dto.cancelReason, dto.cancelAmount);
      const cancelled = await this.paymentRepo.save(payment);

      this.logger.log(`Payment cancelled: ${cancelled.id}`);

      return cancelled;
    } catch (error) {
      this.logger.error(`Payment cancellation failed: ${error.message}`);
      throw new BadRequestException(
        error.response?.data?.message || 'Payment cancellation failed'
      );
    }
  }

  /**
   * 사용자 빌링키 조회
   */
  async getUserBillingKey(userId: string): Promise<BillingKey | null> {
    return this.billingKeyRepo.findOne({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 빌링키 비활성화
   */
  async deactivateBillingKey(billingKeyId: string): Promise<void> {
    const billingKey = await this.billingKeyRepo.findOne({
      where: { id: billingKeyId },
    });

    if (!billingKey) {
      throw new BadRequestException('Billing key not found');
    }

    billingKey.deactivate();
    await this.billingKeyRepo.save(billingKey);

    this.logger.log(`Billing key deactivated: ${billingKeyId}`);
  }

  /**
   * 인증 토큰 생성 (Base64)
   */
  private getAuthToken(): string {
    return Buffer.from(`${this.secretKey}:`).toString('base64');
  }
}
