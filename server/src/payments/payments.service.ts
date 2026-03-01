import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgService } from '../database/pg.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  PaymentSubscribeDto,
  PaymentPurchaseDto,
} from '../common/dto/payment.dto';
import { BillingKeyDto } from '../common/dto/payment.dto';
import {
  TossPaymentsBillingClient,
  type TossBillingPaymentRequest,
} from './toss-payments.client';

const PG_PROVIDER_TOSSPAYMENTS = 'TOSSPAYMENTS';

@Injectable()
export class PaymentsService {
  private tossClient: TossPaymentsBillingClient | null = null;

  constructor(
    private readonly db: PgService,
    private config: ConfigService,
    private subscriptionsService: SubscriptionsService,
  ) {
    const secret = this.config.get<string>('TOSSPAYMENTS_SECRET_KEY');
    if (secret) {
      this.tossClient = new TossPaymentsBillingClient(secret);
    }
  }

  /**
   * After payment window success: issue billing key from authKey, save to subscription,
   * run first payment, then activate subscription.
   */
  async issueBillingKeyAndConfirmSubscription(
    userId: number,
    dto: BillingKeyDto,
  ) {
    const subscriptionId = parseInt(dto.subscriptionId, 10);
    if (Number.isNaN(subscriptionId)) {
      throw new BadRequestException('유효하지 않은 구독 ID입니다.');
    }

    const subRes = await this.db.query<{
      id: number;
      userId: number;
      status: string;
      customerKey: string | null;
      displayName: string;
      planName: string;
      totalPrice: number;
      email: string | null;
      name: string;
      nickname: string | null;
    }>(
      `SELECT s.id, s."userId", s.status, s."customerKey",
              p."displayName", p."planName", p."totalPrice",
              u.email, u.name, u.nickname
       FROM subscriptions s JOIN subscription_plans p ON p.id = s."planId" JOIN users u ON u.id = s."userId" WHERE s.id = $1`,
      [subscriptionId],
    );
    const sub = subRes.rows[0];
    if (!sub) throw new NotFoundException('구독을 찾을 수 없습니다.');
    if (sub.userId !== userId) {
      throw new ForbiddenException('본인의 구독만 처리할 수 있습니다.');
    }
    if (sub.status !== 'PENDING') {
      throw new BadRequestException(
        `이미 ${sub.status} 상태입니다. 결제창에서 카드 등록 후 다시 시도해 주세요.`,
      );
    }
    if (sub.customerKey && sub.customerKey !== dto.customerKey) {
      throw new BadRequestException('구독 정보가 일치하지 않습니다.');
    }

    if (!this.tossClient) {
      throw new BadRequestException(
        '결제 서비스가 설정되지 않았습니다. (TOSSPAYMENTS_SECRET_KEY)',
      );
    }

    const billingKeyResult = await this.tossClient.issueBillingKey(
      dto.customerKey,
      dto.authKey,
    );

    await this.db.query(
      `UPDATE subscriptions SET "customerKey" = $1, "billingKey" = $2, "updatedAt" = NOW() WHERE id = $3`,
      [dto.customerKey, billingKeyResult.billingKey, subscriptionId],
    );

    const orderId = `sub-${subscriptionId}-${Date.now()}`;
    const orderName = sub.displayName || sub.planName;
    const amount = sub.totalPrice;
    const customerEmail = sub.email ?? '';
    const customerName = sub.name ?? sub.nickname ?? '회원';

    const paymentBody: TossBillingPaymentRequest = {
      customerKey: dto.customerKey,
      amount,
      orderId,
      orderName,
      customerEmail,
      customerName,
      taxFreeAmount: 0,
    };

    try {
      const paymentResult = await this.tossClient.requestBillingPayment(
        billingKeyResult.billingKey,
        paymentBody,
      );

      if (paymentResult.status !== 'DONE') {
        throw new Error(`결제 상태: ${paymentResult.status}`);
      }

await this.db.query(
        `INSERT INTO billing_histories ("userId", amount, status, "pgProvider", "pgTransactionId") VALUES ($1, $2, 'SUCCESS', $3, $4)`,
        [sub.userId, amount, PG_PROVIDER_TOSSPAYMENTS, paymentResult.paymentKey],
      );

      await this.db.query(
        `UPDATE subscriptions SET "lastBilledAt" = NOW(), "updatedAt" = NOW() WHERE id = $1`,
        [subscriptionId],
      );

      const activated = await this.subscriptionsService.activate(
        subscriptionId,
        userId,
        { billingKey: billingKeyResult.billingKey },
      );

      return {
        success: true,
        subscription: activated,
        paymentKey: paymentResult.paymentKey,
        orderId: paymentResult.orderId,
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '첫 결제에 실패했습니다.';
      await this.db.query(
        `INSERT INTO billing_histories ("userId", amount, status, "pgProvider", "errorMessage") VALUES ($1, $2, 'FAILED', $3, $4)`,
        [sub.userId, amount, PG_PROVIDER_TOSSPAYMENTS, message],
      );
      throw new BadRequestException(message);
    }
  }

  async processSubscription(userId: number, dto: PaymentSubscribeDto) {
    const planRes = await this.db.query<{ totalPrice: number; displayName: string }>(
      'SELECT "totalPrice", "displayName" FROM subscription_plans WHERE id = $1',
      [Number(dto.planId)],
    );
    const plan = planRes.rows[0];
    if (!plan) throw new NotFoundException('플랜을 찾을 수 없습니다');

    const billingRes = await this.db.query<{ id: number; userId: number; amount: number; status: string; pgProvider: string | null; createdAt: Date }>(
      `INSERT INTO billing_histories ("userId", amount, status, "pgProvider") VALUES ($1, $2, 'SUCCESS', $3) RETURNING id, "userId", amount, status, "pgProvider", "createdAt"`,
      [userId, plan.totalPrice, dto.paymentMethod],
    );
    const billing = billingRes.rows[0]!;
    return { billing, planName: plan.displayName };
  }

  async processPurchase(userId: number, dto: PaymentPurchaseDto) {
    const res = await this.db.query(
      `INSERT INTO billing_histories ("userId", amount, status, "pgProvider", "pgTransactionId") VALUES ($1, $2, 'SUCCESS', $3, $4) RETURNING *`,
      [userId, dto.amount, dto.paymentMethod, dto.pgTransactionId ?? null],
    );
    const billing = res.rows[0];
    return { billing };
  }

  async getHistory(userId: number) {
    const res = await this.db.query(
      'SELECT * FROM billing_histories WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [userId],
    );
    return res.rows;
  }

  /** Used by scheduler: request billing payment for a subscription (recurring). */
  async requestRecurringBilling(subscriptionId: number): Promise<boolean> {
    const subRes = await this.db.query<{
      id: number;
      userId: number;
      status: string;
      billingKey: string | null;
      customerKey: string | null;
      nextBillingDate: Date | null;
      displayName: string;
      planName: string;
      totalPrice: number;
      totalTickets: number;
      matrixTickets: number;
      email: string | null;
      name: string;
      nickname: string | null;
    }>(
      `SELECT s.id, s."userId", s.status, s."billingKey", s."customerKey", s."nextBillingDate",
              p."displayName", p."planName", p."totalPrice", p."totalTickets", p."matrixTickets",
              u.email, u.name, u.nickname
       FROM subscriptions s JOIN subscription_plans p ON p.id = s."planId" JOIN users u ON u.id = s."userId" WHERE s.id = $1`,
      [subscriptionId],
    );
    const sub = subRes.rows[0];
    if (
      !sub ||
      sub.status !== 'ACTIVE' ||
      !sub.billingKey ||
      !sub.customerKey
    ) {
      return false;
    }

    if (!this.tossClient) return false;

    const orderId = `sub-${sub.id}-${Date.now()}`;
    const orderName = sub.displayName || sub.planName;
    const amount = sub.totalPrice;
    const customerEmail = sub.email ?? '';
    const customerName = sub.name ?? sub.nickname ?? '회원';

    try {
      const result = await this.tossClient.requestBillingPayment(
        sub.billingKey,
        {
          customerKey: sub.customerKey,
          amount,
          orderId,
          orderName,
          customerEmail,
          customerName,
          taxFreeAmount: 0,
        },
      );

      if (result.status !== 'DONE') {
        await this.db.query(
          `INSERT INTO billing_histories ("userId", amount, status, "pgProvider", "pgTransactionId", "errorMessage") VALUES ($1, $2, 'FAILED', $3, $4, $5)`,
          [sub.userId, amount, PG_PROVIDER_TOSSPAYMENTS, result.paymentKey, `status: ${result.status}`],
        );
        await this.db.query(
          `UPDATE subscriptions SET status = 'EXPIRED', "updatedAt" = NOW() WHERE id = $1`,
          [subscriptionId],
        );
        return false;
      }

      await this.db.query(
        `INSERT INTO billing_histories ("userId", amount, status, "pgProvider", "pgTransactionId") VALUES ($1, $2, 'SUCCESS', $3, $4)`,
        [sub.userId, amount, PG_PROVIDER_TOSSPAYMENTS, result.paymentKey],
      );

      const nextBillingDate = new Date(sub.nextBillingDate!);
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);

      await this.db.query(
        `UPDATE subscriptions SET "lastBilledAt" = NOW(), "nextBillingDate" = $1, "updatedAt" = NOW() WHERE id = $2`,
        [nextBillingDate, subscriptionId],
      );

      const ticketExpiresAt = new Date(nextBillingDate);
      const ticketsToIssue = sub.totalTickets;
      const matrixTicketsToIssue = sub.matrixTickets ?? 0;

      for (let i = 0; i < ticketsToIssue; i++) {
        await this.db.query(
          `INSERT INTO prediction_tickets ("userId", "subscriptionId", type, status, "expiresAt") VALUES ($1, $2, 'RACE', 'AVAILABLE', $3)`,
          [sub.userId, sub.id, ticketExpiresAt],
        );
      }
      for (let i = 0; i < matrixTicketsToIssue; i++) {
        await this.db.query(
          `INSERT INTO prediction_tickets ("userId", "subscriptionId", type, status, "expiresAt") VALUES ($1, $2, 'MATRIX', 'AVAILABLE', $3)`,
          [sub.userId, sub.id, ticketExpiresAt],
        );
      }

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '자동 결제 실패';
      await this.db.query(
        `INSERT INTO billing_histories ("userId", amount, status, "pgProvider", "errorMessage") VALUES ($1, $2, 'FAILED', $3, $4)`,
        [sub.userId, amount, PG_PROVIDER_TOSSPAYMENTS, message],
      );
      await this.db.query(
        `UPDATE subscriptions SET status = 'EXPIRED', "updatedAt" = NOW() WHERE id = $1`,
        [subscriptionId],
      );
      return false;
    }
  }
}
