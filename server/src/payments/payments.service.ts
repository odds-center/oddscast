import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
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
    private prisma: PrismaService,
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

    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true, user: true },
    });

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

    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        customerKey: dto.customerKey,
        billingKey: billingKeyResult.billingKey,
      },
    });

    const orderId = `sub-${subscriptionId}-${Date.now()}`;
    const orderName = sub.plan.displayName || sub.plan.planName;
    const amount = sub.plan.totalPrice;
    const customerEmail = sub.user.email ?? '';
    const customerName = sub.user.name ?? sub.user.nickname ?? '회원';

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

      await this.prisma.billingHistory.create({
        data: {
          userId: sub.userId,
          amount,
          status: 'SUCCESS',
          pgProvider: PG_PROVIDER_TOSSPAYMENTS,
          pgTransactionId: paymentResult.paymentKey,
        },
      });

      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: { lastBilledAt: new Date() },
      });

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
      await this.prisma.billingHistory.create({
        data: {
          userId: sub.userId,
          amount,
          status: 'FAILED',
          pgProvider: PG_PROVIDER_TOSSPAYMENTS,
          errorMessage: message,
        },
      });
      throw new BadRequestException(message);
    }
  }

  async processSubscription(userId: number, dto: PaymentSubscribeDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: Number(dto.planId) },
    });
    if (!plan) throw new NotFoundException('플랜을 찾을 수 없습니다');

    const billing = await this.prisma.billingHistory.create({
      data: {
        userId,
        amount: plan.totalPrice,
        status: 'SUCCESS',
        pgProvider: dto.paymentMethod,
      },
    });

    return { billing, planName: plan.displayName };
  }

  async processPurchase(userId: number, dto: PaymentPurchaseDto) {
    const billing = await this.prisma.billingHistory.create({
      data: {
        userId,
        amount: dto.amount,
        status: 'SUCCESS',
        pgProvider: dto.paymentMethod,
        pgTransactionId: dto.pgTransactionId,
      },
    });

    return { billing };
  }

  async getHistory(userId: number) {
    return this.prisma.billingHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Used by scheduler: request billing payment for a subscription (recurring). */
  async requestRecurringBilling(subscriptionId: number): Promise<boolean> {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true, user: true },
    });

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
    const orderName = sub.plan.displayName || sub.plan.planName;
    const amount = sub.plan.totalPrice;
    const customerEmail = sub.user.email ?? '';
    const customerName = sub.user.name ?? sub.user.nickname ?? '회원';

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
        await this.prisma.billingHistory.create({
          data: {
            userId: sub.userId,
            amount,
            status: 'FAILED',
            pgProvider: PG_PROVIDER_TOSSPAYMENTS,
            pgTransactionId: result.paymentKey,
            errorMessage: `status: ${result.status}`,
          },
        });
        await this.prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'EXPIRED' },
        });
        return false;
      }

      await this.prisma.billingHistory.create({
        data: {
          userId: sub.userId,
          amount,
          status: 'SUCCESS',
          pgProvider: PG_PROVIDER_TOSSPAYMENTS,
          pgTransactionId: result.paymentKey,
        },
      });

      const nextBillingDate = new Date(sub.nextBillingDate!);
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);

      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          lastBilledAt: new Date(),
          nextBillingDate,
        },
      });

      const ticketExpiresAt = new Date(nextBillingDate);
      const ticketsToIssue = sub.plan.totalTickets;
      const matrixTicketsToIssue =
        (sub.plan as { matrixTickets?: number }).matrixTickets ?? 0;

      const raceTicketData = Array.from({ length: ticketsToIssue }, () => ({
        userId: sub.userId,
        subscriptionId: sub.id,
        type: 'RACE' as const,
        status: 'AVAILABLE' as const,
        expiresAt: ticketExpiresAt,
      }));
      const matrixTicketData = Array.from(
        { length: matrixTicketsToIssue },
        () => ({
          userId: sub.userId,
          subscriptionId: sub.id,
          type: 'MATRIX' as const,
          status: 'AVAILABLE' as const,
          expiresAt: ticketExpiresAt,
        }),
      );

      await this.prisma.predictionTicket.createMany({
        data: [...raceTicketData, ...matrixTicketData],
      });

      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '자동 결제 실패';
      await this.prisma.billingHistory.create({
        data: {
          userId: sub.userId,
          amount,
          status: 'FAILED',
          pgProvider: PG_PROVIDER_TOSSPAYMENTS,
          errorMessage: message,
        },
      });
      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'EXPIRED' },
      });
      return false;
    }
  }
}
