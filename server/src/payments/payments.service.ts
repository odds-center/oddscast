import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../database/entities/subscription.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { BillingHistory } from '../database/entities/billing-history.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import {
  SubscriptionStatus,
  PaymentStatus,
  TicketType,
  TicketStatus,
} from '../database/db-enums';
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
import { DiscordService } from '../discord/discord.service';

const PG_PROVIDER_TOSSPAYMENTS = 'TOSSPAYMENTS';

@Injectable()
export class PaymentsService {
  private tossClient: TossPaymentsBillingClient | null = null;

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(BillingHistory)
    private readonly billingHistoryRepo: Repository<BillingHistory>,
    @InjectRepository(PredictionTicket)
    private readonly predictionTicketRepo: Repository<PredictionTicket>,
    private config: ConfigService,
    private subscriptionsService: SubscriptionsService,
    private readonly discordService: DiscordService,
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

    const sub = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      relations: ['plan', 'user'],
    });
    if (!sub) throw new NotFoundException('구독을 찾을 수 없습니다.');
    if (sub.userId !== userId) {
      throw new ForbiddenException('본인의 구독만 처리할 수 있습니다.');
    }
    if (sub.status !== SubscriptionStatus.PENDING) {
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

    const plan = sub.plan;
    if (!plan) throw new NotFoundException('플랜 정보를 찾을 수 없습니다.');

    const billingKeyResult = await this.tossClient.issueBillingKey(
      dto.customerKey,
      dto.authKey,
    );

    await this.subscriptionRepo.update(subscriptionId, {
      customerKey: dto.customerKey,
      billingKey: billingKeyResult.billingKey,
      updatedAt: new Date(),
    });

    const orderId = `sub-${subscriptionId}-${Date.now()}`;
    const orderName = plan.displayName || plan.planName;
    const amount = plan.totalPrice;
    const customerEmail = sub.user?.email ?? '';
    const customerName = sub.user?.nickname ?? '회원';

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

      const now = new Date();
      await this.billingHistoryRepo.save(
        this.billingHistoryRepo.create({
          userId: sub.userId,
          amount,
          billingDate: now,
          status: PaymentStatus.SUCCESS,
          pgProvider: PG_PROVIDER_TOSSPAYMENTS,
          pgTransactionId: paymentResult.paymentKey,
        }),
      );

      await this.subscriptionRepo.update(subscriptionId, {
        lastBilledAt: now,
        updatedAt: now,
      });

      const activated = await this.subscriptionsService.activate(
        subscriptionId,
        userId,
        { billingKey: billingKeyResult.billingKey },
      );

      void this.discordService.notifySubscriptionPayment({
        userId: sub.userId,
        email: customerEmail,
        planName: orderName,
        amount,
        paymentKey: paymentResult.paymentKey,
        orderId: paymentResult.orderId,
      });

      return {
        success: true,
        subscription: activated,
        paymentKey: paymentResult.paymentKey,
        orderId: paymentResult.orderId,
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '첫 결제에 실패했습니다.';
      const now = new Date();
      await this.billingHistoryRepo.save(
        this.billingHistoryRepo.create({
          userId: sub.userId,
          amount,
          billingDate: now,
          status: PaymentStatus.FAILED,
          pgProvider: PG_PROVIDER_TOSSPAYMENTS,
          errorMessage: message,
        }),
      );
      throw new BadRequestException(message);
    }
  }

  async processSubscription(userId: number, dto: PaymentSubscribeDto) {
    const plan = await this.planRepo.findOne({
      where: { id: Number(dto.planId) },
      select: ['totalPrice', 'displayName'],
    });
    if (!plan) throw new NotFoundException('플랜을 찾을 수 없습니다');

    const now = new Date();
    const billing = await this.billingHistoryRepo.save(
      this.billingHistoryRepo.create({
        userId,
        amount: plan.totalPrice,
        billingDate: now,
        status: PaymentStatus.SUCCESS,
        pgProvider: dto.paymentMethod ?? null,
      }),
    );
    return { billing, planName: plan.displayName };
  }

  async processPurchase(userId: number, dto: PaymentPurchaseDto) {
    const now = new Date();
    const billing = await this.billingHistoryRepo.save(
      this.billingHistoryRepo.create({
        userId,
        amount: dto.amount,
        billingDate: now,
        status: PaymentStatus.SUCCESS,
        pgProvider: dto.paymentMethod ?? null,
        pgTransactionId: dto.pgTransactionId ?? null,
      }),
    );
    return { billing };
  }

  async getHistory(userId: number) {
    return this.billingHistoryRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Used by scheduler: request billing payment for a subscription (recurring). */
  async requestRecurringBilling(subscriptionId: number): Promise<boolean> {
    const sub = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      relations: ['plan', 'user'],
    });
    if (
      !sub ||
      sub.status !== SubscriptionStatus.ACTIVE ||
      !sub.billingKey ||
      !sub.customerKey
    ) {
      return false;
    }

    const plan = sub.plan;
    if (!plan) return false;

    if (!this.tossClient) return false;

    const orderId = `sub-${sub.id}-${Date.now()}`;
    const orderName = plan.displayName || plan.planName;
    const amount = plan.totalPrice;
    const customerEmail = sub.user?.email ?? '';
    const customerName = sub.user?.nickname ?? '회원';

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
        const now = new Date();
        await this.billingHistoryRepo.save(
          this.billingHistoryRepo.create({
            userId: sub.userId,
            amount,
            billingDate: now,
            status: PaymentStatus.FAILED,
            pgProvider: PG_PROVIDER_TOSSPAYMENTS,
            pgTransactionId: result.paymentKey,
            errorMessage: `status: ${result.status}`,
          }),
        );
        await this.subscriptionRepo.update(subscriptionId, {
          status: SubscriptionStatus.EXPIRED,
          updatedAt: now,
        });
        return false;
      }

      const now = new Date();
      await this.billingHistoryRepo.save(
        this.billingHistoryRepo.create({
          userId: sub.userId,
          amount,
          billingDate: now,
          status: PaymentStatus.SUCCESS,
          pgProvider: PG_PROVIDER_TOSSPAYMENTS,
          pgTransactionId: result.paymentKey,
        }),
      );

      const baseBillingDate = sub.nextBillingDate
        ? new Date(sub.nextBillingDate)
        : now;
      const nextBillingDate = new Date(baseBillingDate);
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);

      await this.subscriptionRepo.update(subscriptionId, {
        lastBilledAt: now,
        nextBillingDate,
        updatedAt: now,
      });

      const ticketExpiresAt = new Date(nextBillingDate);
      const ticketsToIssue = plan.totalTickets;
      const matrixTicketsToIssue = plan.matrixTickets ?? 0;

      for (let i = 0; i < ticketsToIssue; i++) {
        await this.predictionTicketRepo.save(
          this.predictionTicketRepo.create({
            userId: sub.userId,
            subscriptionId: sub.id,
            type: TicketType.RACE,
            status: TicketStatus.AVAILABLE,
            expiresAt: ticketExpiresAt,
            issuedAt: now,
          }),
        );
      }
      for (let i = 0; i < matrixTicketsToIssue; i++) {
        await this.predictionTicketRepo.save(
          this.predictionTicketRepo.create({
            userId: sub.userId,
            subscriptionId: sub.id,
            type: TicketType.MATRIX,
            status: TicketStatus.AVAILABLE,
            expiresAt: ticketExpiresAt,
            issuedAt: now,
          }),
        );
      }

      void this.discordService.notifyRecurringBilling({
        userId: sub.userId,
        subscriptionId: sub.id,
        planName: orderName,
        amount,
      });

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '자동 결제 실패';
      const now = new Date();
      await this.billingHistoryRepo.save(
        this.billingHistoryRepo.create({
          userId: sub.userId,
          amount,
          billingDate: now,
          status: PaymentStatus.FAILED,
          pgProvider: PG_PROVIDER_TOSSPAYMENTS,
          errorMessage: message,
        }),
      );
      await this.subscriptionRepo.update(subscriptionId, {
        status: SubscriptionStatus.EXPIRED,
        updatedAt: now,
      });
      return false;
    }
  }
}
