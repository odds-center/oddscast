import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { BillingHistory } from './entities/billing-history.entity';
import { TossPaymentService } from './toss.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PredictionTicketsService } from '../prediction-tickets/prediction-tickets.service';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment-timezone';

/**
 * 구독 결제 요청
 */
export interface SubscribeRequest {
  userId: string;
  planId: string;
  cardNumber: string;
  cardExpirationYear: string;
  cardExpirationMonth: string;
  cardPassword: string;
  customerBirthday: string;
  customerName: string;
  customerEmail: string;
}

/**
 * 개별 구매 요청
 */
export interface SinglePurchaseRequest {
  userId: string;
  ticketCount: number;
  paymentKey: string; // 모바일에서 결제 완료 후 전달
  orderId: string;
  amount: number;
}

/**
 * 결제 서비스 (Toss Payments 기반)
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(BillingHistory)
    private readonly billingRepo: Repository<BillingHistory>,
    private readonly tossService: TossPaymentService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly ticketsService: PredictionTicketsService
  ) {}

  /**
   * 구독 결제 시작
   *
   * 1. 빌링키 발급
   * 2. 첫 결제
   * 3. 구독 생성
   * 4. 예측권 발급
   */
  async startSubscription(data: SubscribeRequest) {
    this.logger.log(`구독 시작: ${data.userId} | 플랜: ${data.planId}`);

    try {
      // 1. 빌링키 발급
      const billingKey = await this.tossService.issueBillingKey({
        customerKey: data.userId,
        cardNumber: data.cardNumber,
        cardExpirationYear: data.cardExpirationYear,
        cardExpirationMonth: data.cardExpirationMonth,
        cardPassword: data.cardPassword,
        customerBirthday: data.customerBirthday,
        customerName: data.customerName,
      });

      // 2. 플랜 정보 조회
      const plan = await this.subscriptionsService.getPlanById(data.planId);

      if (!plan) {
        throw new NotFoundException(`플랜을 찾을 수 없습니다: ${data.planId}`);
      }

      // 3. 첫 결제 실행
      const orderId = `sub-${uuidv4()}`;
      const payment = await this.tossService.chargeWithBillingKey({
        billingKey,
        customerKey: data.userId,
        amount: plan.totalPrice,
        orderName: `${plan.displayName} (첫 결제)`,
        orderId,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
      });

      if (!payment.success) {
        throw new BadRequestException(
          payment.error?.message || '첫 결제에 실패했습니다.'
        );
      }

      // 4. 구독 생성
      const subscription = await this.subscriptionsService.createSubscription({
        userId: data.userId,
        planId: data.planId,
        billingKey: await this.encryptBillingKey(billingKey),
      });

      // 5. 결제 이력 저장
      await this.createBillingHistory({
        subscriptionId: subscription.id,
        userId: data.userId,
        amount: plan.totalPrice,
        pgTransactionId: payment.paymentKey!,
        status: 'SUCCESS',
      });

      // 6. 예측권 발급
      const ticketCount = plan.totalTickets;
      await this.ticketsService.issueTickets({
        userId: data.userId,
        subscriptionId: subscription.id,
        quantity: ticketCount,
        validDays: 30,
        source: 'subscription',
      });

      this.logger.log(
        `✅ 구독 완료: ${subscription.id} | 예측권 ${ticketCount}장 발급`
      );

      return {
        subscriptionId: subscription.id,
        ticketsIssued: ticketCount,
        nextBillingDate: subscription.nextBillingDate,
        paymentKey: payment.paymentKey,
      };
    } catch (error) {
      this.logger.error(`❌ 구독 시작 실패: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 매월 자동 결제 (Cron Job)
   *
   * 매월 1일 00:00에 활성 구독자 자동 결제
   */
  @Cron('0 0 1 * *', {
    name: 'monthly-subscription-billing',
    timeZone: 'Asia/Seoul',
  })
  async processMonthlyBilling() {
    this.logger.log('🔄 [정기 결제] 시작');

    const activeSubscriptions =
      await this.subscriptionsService.getActiveSubscriptions();

    this.logger.log(
      `[정기 결제] ${activeSubscriptions.length}개 구독 처리 대상`
    );

    let successCount = 0;
    let failCount = 0;

    for (const sub of activeSubscriptions) {
      try {
        const billingKey = await this.decryptBillingKey(sub.billingKey);
        const plan = await this.subscriptionsService.getPlanById(sub.planId);

        // 정기 결제
        const orderId = `sub-${sub.id}-${moment().format('YYYYMM')}`;
        const payment = await this.tossService.chargeWithBillingKey({
          billingKey,
          customerKey: sub.userId,
          amount: plan.totalPrice,
          orderName: `${plan.displayName} (${moment().format('YYYY년 MM월')})`,
          orderId,
        });

        if (payment.success) {
          // 결제 성공
          await this.createBillingHistory({
            subscriptionId: sub.id,
            userId: sub.userId,
            amount: plan.totalPrice,
            pgTransactionId: payment.paymentKey!,
            status: 'SUCCESS',
          });

          // 새 예측권 발급
          const ticketCount = plan.totalTickets;
          await this.ticketsService.issueTickets({
            userId: sub.userId,
            subscriptionId: sub.id,
            quantity: ticketCount,
            validDays: 30,
            source: 'subscription',
          });

          // 구독 갱신
          await this.subscriptionsService.renewSubscription(sub.id);

          successCount++;
          this.logger.log(`✅ 결제 성공: ${sub.id} | ${ticketCount}장 발급`);
        } else {
          // 결제 실패
          failCount++;

          await this.createBillingHistory({
            subscriptionId: sub.id,
            userId: sub.userId,
            amount: plan.totalPrice,
            pgTransactionId: payment.paymentKey || 'N/A',
            status: 'FAILED',
            errorMessage: payment.error?.message,
          });

          // 구독 일시 정지 (3회 실패 시)
          await this.subscriptionsService.handleBillingFailure(sub.id);

          this.logger.error(
            `❌ 결제 실패: ${sub.id} | ${payment.error?.message}`
          );
        }

        // API Rate Limit 방지
        await this.sleep(1000);
      } catch (error) {
        failCount++;
        this.logger.error(`❌ 정기 결제 오류: ${sub.id}`, error.stack);
      }
    }

    this.logger.log(
      `🎉 [정기 결제] 완료 | 성공: ${successCount}, 실패: ${failCount}`
    );
  }

  /**
   * 개별 예측권 구매
   *
   * 모바일에서 Toss SDK로 결제 완료 후 호출
   */
  async purchaseSingleTickets(data: SinglePurchaseRequest) {
    this.logger.log(`개별 구매: ${data.userId} | ${data.ticketCount}장`);

    try {
      // 1. 결제 승인 확인
      await this.tossService.confirmPayment(
        data.paymentKey,
        data.orderId,
        data.amount
      );

      // 2. 예측권 발급
      await this.ticketsService.issueTickets({
        userId: data.userId,
        subscriptionId: null,
        quantity: data.ticketCount,
        validDays: 30,
        source: 'single_purchase',
      });

      // 3. 결제 이력 저장
      await this.createBillingHistory({
        subscriptionId: null,
        userId: data.userId,
        amount: data.amount,
        pgTransactionId: data.paymentKey,
        status: 'SUCCESS',
      });

      this.logger.log(`✅ 개별 구매 완료: ${data.ticketCount}장 발급`);

      return {
        ticketsIssued: data.ticketCount,
        transactionId: data.paymentKey,
      };
    } catch (error) {
      this.logger.error(`❌ 개별 구매 실패: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 결제 내역 조회
   */
  async getBillingHistory(userId: string, limit = 20) {
    return this.billingRepo.find({
      where: { userId },
      order: { billingDate: 'DESC' },
      take: limit,
    });
  }

  /**
   * 결제 이력 생성
   */
  private async createBillingHistory(data: {
    subscriptionId: string | null;
    userId: string;
    amount: number;
    pgTransactionId: string;
    status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
    errorMessage?: string;
  }) {
    const history = this.billingRepo.create({
      id: uuidv4(),
      subscriptionId: data.subscriptionId,
      userId: data.userId,
      amount: data.amount,
      billingDate: new Date(),
      pgProvider: 'TOSS',
      pgTransactionId: data.pgTransactionId,
      status: data.status,
      errorMessage: data.errorMessage,
    });

    return this.billingRepo.save(history);
  }

  /**
   * 빌링키 암호화 (보안)
   */
  private async encryptBillingKey(billingKey: string): Promise<string> {
    // TODO: 실제 암호화 구현 (crypto-js 등)
    return Buffer.from(billingKey).toString('base64');
  }

  /**
   * 빌링키 복호화
   */
  private async decryptBillingKey(encrypted: string): Promise<string> {
    // TODO: 실제 복호화 구현
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
