import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RefundRequest,
  RefundRequestStatus,
  RefundRequestType,
} from '../database/entities/refund-request.entity';
import { BillingHistory } from '../database/entities/billing-history.entity';
import { Subscription } from '../database/entities/subscription.entity';
import { PredictionTicket } from '../database/entities/prediction-ticket.entity';
import { PaymentStatus, TicketStatus } from '../database/db-enums';
import { TossPaymentsBillingClient } from '../payments/toss-payments.client';
import { CreateRefundRequestDto, ProcessRefundDto } from './dto/refund.dto';
import { ConfigService } from '@nestjs/config';
import { DiscordService } from '../discord/discord.service';

/** Result shape for calculateRefund */
interface RefundCalculation {
  isEligible: boolean;
  ineligibilityReason: string | null;
  requestedAmount: number;
  usedTickets: number;
  totalTickets: number;
  daysSincePayment: number;
}

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);
  private readonly tossClient: TossPaymentsBillingClient | null;

  constructor(
    @InjectRepository(RefundRequest)
    private readonly refundRepo: Repository<RefundRequest>,
    @InjectRepository(BillingHistory)
    private readonly billingRepo: Repository<BillingHistory>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(PredictionTicket)
    private readonly ticketRepo: Repository<PredictionTicket>,
    private readonly config: ConfigService,
    private readonly discordService: DiscordService,
  ) {
    const secret = this.config.get<string>('TOSSPAYMENTS_SECRET_KEY');
    this.tossClient = secret ? new TossPaymentsBillingClient(secret) : null;
  }

  /**
   * Calculate refund eligibility and amount based on business policy:
   * - Within 7 days + unused tickets → full/partial refund (proportional to unused ratio)
   * - After 7 days with no unused tickets → not eligible
   * - Already refunded or failed billing → not eligible
   */
  private async calculateRefund(
    billingHistory: BillingHistory,
    subscription: Subscription | null,
  ): Promise<RefundCalculation> {
    const daysSincePayment = Math.floor(
      (Date.now() - new Date(billingHistory.billingDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Already refunded
    if (billingHistory.status === PaymentStatus.REFUNDED) {
      return {
        isEligible: false,
        ineligibilityReason: '이미 환불 처리된 결제입니다.',
        requestedAmount: 0,
        usedTickets: 0,
        totalTickets: 0,
        daysSincePayment,
      };
    }

    // Failed billing has nothing to refund
    if (billingHistory.status === PaymentStatus.FAILED) {
      return {
        isEligible: false,
        ineligibilityReason: '결제 실패 건은 환불 대상이 아닙니다.',
        requestedAmount: 0,
        usedTickets: 0,
        totalTickets: 0,
        daysSincePayment,
      };
    }

    // Count tickets issued from this subscription after this billing date
    let usedTickets = 0;
    let totalTickets = 0;

    if (subscription) {
      const plan = subscription.plan;
      totalTickets = (plan?.totalTickets ?? 0) + (plan?.matrixTickets ?? 0);

      usedTickets = await this.ticketRepo
        .createQueryBuilder('t')
        .where('t.subscriptionId = :subId', { subId: subscription.id })
        .andWhere('t.status = :status', { status: TicketStatus.USED })
        .andWhere('t.issuedAt >= :billingDate', {
          billingDate: billingHistory.billingDate,
        })
        .getCount();
    }

    // Policy: after 7 days with no unused tickets → ineligible
    const unusedTickets = Math.max(0, totalTickets - usedTickets);
    if (daysSincePayment > 7 && unusedTickets === 0) {
      return {
        isEligible: false,
        ineligibilityReason:
          '환불 가능 기간(7일)이 경과하였고 이용 가능한 티켓이 없습니다.',
        requestedAmount: 0,
        usedTickets,
        totalTickets,
        daysSincePayment,
      };
    }

    // Calculate proportional refund amount based on unused tickets
    const refundRatio = totalTickets > 0 ? unusedTickets / totalTickets : 0;
    const requestedAmount = Math.floor(billingHistory.amount * refundRatio);

    return {
      isEligible: true,
      ineligibilityReason: null,
      requestedAmount,
      usedTickets,
      totalTickets,
      daysSincePayment,
    };
  }

  /**
   * User submits a refund request for a billing history entry.
   * Validates eligibility and prevents duplicate PENDING requests.
   */
  async requestRefund(
    userId: number,
    dto: CreateRefundRequestDto,
  ): Promise<RefundRequest> {
    const billing = await this.billingRepo.findOne({
      where: { id: dto.billingHistoryId, userId },
    });
    if (!billing) {
      throw new NotFoundException('결제 내역을 찾을 수 없습니다.');
    }

    // Prevent duplicate pending requests for the same billing entry
    const existing = await this.refundRepo.findOne({
      where: {
        billingHistoryId: dto.billingHistoryId,
        status: RefundRequestStatus.PENDING,
      },
    });
    if (existing) {
      throw new ConflictException('이미 환불 심사 중인 요청이 있습니다.');
    }

    // Find associated subscription (most recent active subscription for this user)
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    const calc = await this.calculateRefund(billing, subscription);

    const refundRequest = this.refundRepo.create({
      userId,
      type: RefundRequestType.SUBSCRIPTION,
      billingHistoryId: billing.id,
      subscriptionId: subscription?.id ?? null,
      status: RefundRequestStatus.PENDING,
      originalAmount: billing.amount,
      requestedAmount: calc.requestedAmount,
      approvedAmount: null,
      usedTickets: calc.usedTickets,
      totalTickets: calc.totalTickets,
      daysSincePayment: calc.daysSincePayment,
      isEligible: calc.isEligible,
      ineligibilityReason: calc.ineligibilityReason,
      userReason: dto.userReason,
      adminNote: null,
      processedByAdminId: null,
      processedAt: null,
      pgTransactionId: billing.pgTransactionId ?? null,
      pgRefundResponse: null,
    });

    const saved = await this.refundRepo.save(refundRequest);
    this.logger.log(
      `[RefundRequest] Created id=${saved.id} userId=${userId} amount=${calc.requestedAmount}`,
    );

    void this.discordService.notifyRefundRequest({
      requestId: saved.id,
      userId,
      originalAmount: billing.amount,
      requestedAmount: calc.requestedAmount,
      isEligible: calc.isEligible,
      ineligibilityReason: calc.ineligibilityReason,
      userReason: dto.userReason,
    });

    return saved;
  }

  /**
   * Admin approves a refund request:
   * 1. Calls Toss cancel API with approved amount
   * 2. Marks billing as REFUNDED
   * 3. Expires all AVAILABLE tickets from the subscription
   * 4. Updates request to APPROVED
   */
  async approveRefund(
    adminId: number,
    refundRequestId: string,
    dto: ProcessRefundDto,
  ): Promise<RefundRequest> {
    const request = await this.refundRepo.findOne({
      where: { id: refundRequestId },
      relations: ['billingHistory', 'subscription'],
    });
    if (!request) {
      throw new NotFoundException('환불 요청을 찾을 수 없습니다.');
    }
    if (request.status !== RefundRequestStatus.PENDING) {
      throw new BadRequestException(
        `이미 ${request.status} 처리된 요청입니다.`,
      );
    }

    const finalAmount = dto.approvedAmount ?? request.requestedAmount;
    const cancelReason = dto.adminNote ?? '관리자 승인 환불';
    const now = new Date();

    // Attempt Toss cancel API if paymentKey is available
    let pgResponse: unknown = null;
    if (request.pgTransactionId && this.tossClient) {
      try {
        pgResponse = await this.tossClient.cancelPayment(
          request.pgTransactionId,
          finalAmount,
          cancelReason,
        );
        this.logger.log(
          `[RefundRequest] Toss cancel OK id=${refundRequestId} paymentKey=${request.pgTransactionId} amount=${finalAmount}`,
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `[RefundRequest] Toss cancel failed id=${refundRequestId}: ${msg}`,
        );
        throw new BadRequestException(`PG 환불 처리 실패: ${msg}`);
      }
    } else {
      this.logger.warn(
        `[RefundRequest] No paymentKey or Toss client — skipping PG cancel for id=${refundRequestId}`,
      );
    }

    // Mark billing as REFUNDED
    if (request.billingHistoryId) {
      await this.billingRepo.update(request.billingHistoryId, {
        status: PaymentStatus.REFUNDED,
      });
    }

    // Expire all AVAILABLE tickets from this subscription
    if (request.subscriptionId) {
      await this.ticketRepo
        .createQueryBuilder()
        .update()
        .set({ status: TicketStatus.EXPIRED })
        .where('"subscriptionId" = :subId', { subId: request.subscriptionId })
        .andWhere('status = :status', { status: TicketStatus.AVAILABLE })
        .execute();
      this.logger.log(
        `[RefundRequest] Expired AVAILABLE tickets for subscriptionId=${request.subscriptionId}`,
      );
    }

    // Update the refund request to APPROVED
    await this.refundRepo.update(refundRequestId, {
      status: RefundRequestStatus.APPROVED,
      approvedAmount: finalAmount,
      adminNote: dto.adminNote ?? null,
      processedByAdminId: adminId,
      processedAt: now,
      pgRefundResponse: pgResponse ? JSON.stringify(pgResponse) : null,
    });

    const updated = await this.refundRepo.findOne({
      where: { id: refundRequestId },
    });

    void this.discordService.notifyRefundProcessed({
      requestId: refundRequestId,
      userId: request.userId!,
      status: 'APPROVED',
      approvedAmount: finalAmount,
      adminNote: dto.adminNote,
    });

    return updated!;
  }

  /**
   * Admin rejects a refund request with an optional reason.
   */
  async rejectRefund(
    adminId: number,
    refundRequestId: string,
    dto: ProcessRefundDto,
  ): Promise<RefundRequest> {
    const request = await this.refundRepo.findOne({
      where: { id: refundRequestId },
    });
    if (!request) {
      throw new NotFoundException('환불 요청을 찾을 수 없습니다.');
    }
    if (request.status !== RefundRequestStatus.PENDING) {
      throw new BadRequestException(
        `이미 ${request.status} 처리된 요청입니다.`,
      );
    }

    const now = new Date();
    await this.refundRepo.update(refundRequestId, {
      status: RefundRequestStatus.REJECTED,
      adminNote: dto.adminNote ?? null,
      processedByAdminId: adminId,
      processedAt: now,
    });

    const updated = await this.refundRepo.findOne({
      where: { id: refundRequestId },
    });
    this.logger.log(
      `[RefundRequest] Rejected id=${refundRequestId} by adminId=${adminId}`,
    );

    void this.discordService.notifyRefundProcessed({
      requestId: refundRequestId,
      userId: request.userId!,
      status: 'REJECTED',
      adminNote: dto.adminNote,
    });

    return updated!;
  }

  /**
   * Admin: list all refund requests with optional status filter.
   */
  async findAll(status?: RefundRequestStatus): Promise<RefundRequest[]> {
    const where = status ? { status } : {};
    return this.refundRepo.find({
      where,
      relations: ['user', 'billingHistory', 'subscription'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * User: list their own refund requests.
   */
  async findByUser(userId: number): Promise<RefundRequest[]> {
    return this.refundRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
