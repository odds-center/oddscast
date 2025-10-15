import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
  SubscriptionPlan,
} from './entities/subscription.entity';
import { SubscriptionPlanEntity } from './entities/subscription-plan.entity';
import { PredictionTicketsService } from '../prediction-tickets/prediction-tickets.service';
import {
  CreateSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionStatusDto,
} from './dto';

/**
 * 구독 서비스
 */
@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionPlanEntity)
    private readonly planRepo: Repository<SubscriptionPlanEntity>,
    private readonly ticketsService: PredictionTicketsService
  ) {}

  /**
   * 구독 플랜 목록 조회
   */
  async getPlans(): Promise<SubscriptionPlanEntity[]> {
    this.logger.log('Fetching subscription plans');

    const plans = await this.planRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });

    return plans;
  }

  /**
   * 플랜 ID로 조회
   */
  async getPlanById(planId: string): Promise<SubscriptionPlanEntity> {
    const plan = await this.planRepo.findOne({ where: { id: planId } });

    if (!plan) {
      throw new NotFoundException(`구독 플랜을 찾을 수 없습니다: ${planId}`);
    }

    return plan;
  }

  /**
   * 모든 활성 구독 조회 (정기 결제용)
   */
  async getActiveSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionRepo.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['user'],
    });
  }

  /**
   * 결제 실패 처리
   *
   * 결제 실패 시 구독 취소 처리
   */
  async handleBillingFailure(subscriptionId: string): Promise<void> {
    const subscription = await this.findOne(subscriptionId);

    // 구독 취소 처리 (결제 실패 시)
    subscription.cancel();

    await this.subscriptionRepo.save(subscription);

    this.logger.warn(`구독 취소 (결제 실패): ${subscriptionId}`);
  }

  /**
   * 구독 생성
   */
  async createSubscription(dto: CreateSubscriptionDto): Promise<Subscription> {
    this.logger.log(`Creating subscription for user: ${dto.userId}`);

    // 기존 활성 구독 확인
    const existing = await this.getActiveSubscription(dto.userId);
    if (existing) {
      throw new ConflictException('User already has an active subscription');
    }

    // 플랜 정보 조회
    const plan = await this.planRepo.findOne({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan not found: ${dto.planId}`);
    }

    // 구독 생성
    const subscription = this.subscriptionRepo.create({
      userId: dto.userId,
      planId: dto.planId || plan.id,
      planName: plan.planName as unknown as SubscriptionPlan,
      originalPrice: plan.originalPrice,
      vat: plan.vat,
      totalPrice: plan.totalPrice,
      ticketsPerMonth: plan.totalTickets,
      status: dto.billingKey
        ? SubscriptionStatus.ACTIVE
        : SubscriptionStatus.PENDING,
      billingKey: dto.billingKey || null,
    });

    const saved = await this.subscriptionRepo.save(subscription);

    // 빌링키가 있으면 즉시 활성화 & 예측권 발급
    if (dto.billingKey) {
      await this.activateSubscription(saved.id, dto.billingKey);
    }

    this.logger.log(`Subscription created: ${saved.id}`);

    return saved;
  }

  /**
   * 구독 활성화 (결제 완료 후)
   */
  async activateSubscription(
    subscriptionId: string,
    billingKey: string
  ): Promise<Subscription> {
    const subscription = await this.findOne(subscriptionId);

    if (subscription.status !== SubscriptionStatus.PENDING) {
      throw new BadRequestException('Subscription is not in pending status');
    }

    // 활성화
    subscription.activate(billingKey);
    const activated = await this.subscriptionRepo.save(subscription);

    // 예측권 30장 발급
    await this.issueMonthlyTickets(activated);

    this.logger.log(`Subscription activated: ${subscriptionId}`);

    return activated;
  }

  /**
   * 구독 갱신 (정기 결제)
   */
  async renewSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = await this.findOne(subscriptionId);

    if (!subscription.isActive()) {
      throw new BadRequestException('Subscription is not active');
    }

    if (!subscription.needsRenewal()) {
      throw new BadRequestException('Subscription does not need renewal yet');
    }

    // 갱신
    subscription.renew();
    const renewed = await this.subscriptionRepo.save(subscription);

    // 예측권 재발급
    await this.issueMonthlyTickets(renewed);

    this.logger.log(`Subscription renewed: ${subscriptionId}`);

    return renewed;
  }

  /**
   * 월간 예측권 발급
   */
  private async issueMonthlyTickets(subscription: Subscription): Promise<void> {
    const quantity = subscription.getMonthlyTickets();

    await this.ticketsService.issueTickets({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      quantity,
      validDays: 30,
    });

    this.logger.log(
      `Issued ${quantity} tickets for subscription: ${subscription.id}`
    );
  }

  /**
   * 구독 취소
   */
  async cancelSubscription(
    userId: string,
    dto: CancelSubscriptionDto
  ): Promise<Subscription> {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    subscription.cancel();
    const cancelled = await this.subscriptionRepo.save(subscription);

    this.logger.log(
      `Subscription cancelled: ${subscription.id}, reason: ${dto.reason || 'N/A'}`
    );

    return cancelled;
  }

  /**
   * 구독 조회 (ID)
   */
  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepo.findOne({ where: { id } });

    if (!subscription) {
      throw new NotFoundException(`Subscription not found: ${id}`);
    }

    return subscription;
  }

  /**
   * 활성 구독 조회
   */
  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepo.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  /**
   * 구독 상태 조회
   */
  async getStatus(userId: string): Promise<SubscriptionStatusDto | null> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId },
      order: { startedAt: 'DESC' },
    });

    if (!subscription) {
      return null;
    }

    return this.toStatusDto(subscription);
  }

  /**
   * 구독 내역 조회
   */
  async getHistory(
    userId: string,
    limit = 10,
    offset = 0
  ): Promise<Subscription[]> {
    return this.subscriptionRepo.find({
      where: { userId },
      order: { startedAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * 갱신 필요한 구독 조회 (배치용)
   */
  async findRenewableSubscriptions(): Promise<Subscription[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.subscriptionRepo.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: LessThanOrEqual(today),
      },
    });
  }

  /**
   * Entity → StatusDto 변환
   */
  private toStatusDto(subscription: Subscription): SubscriptionStatusDto {
    let daysUntilRenewal: number | null = null;

    if (subscription.nextBillingDate) {
      const today = new Date();
      const diff = subscription.nextBillingDate.getTime() - today.getTime();
      daysUntilRenewal = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      id: subscription.id,
      userId: subscription.userId,
      planId: subscription.planName,
      price: subscription.totalPrice,
      status: subscription.status,
      nextBillingDate: subscription.nextBillingDate,
      lastBilledAt: subscription.lastBilledAt,
      startedAt: subscription.startedAt,
      cancelledAt: subscription.cancelledAt,
      isActive: subscription.isActive(),
      monthlyTickets: subscription.getMonthlyTickets(),
      daysUntilRenewal,
    };
  }
}
