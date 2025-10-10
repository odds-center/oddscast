import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SubscriptionStatus {
  PENDING = 'PENDING', // 결제 대기
  ACTIVE = 'ACTIVE', // 활성
  CANCELLED = 'CANCELLED', // 취소됨
  EXPIRED = 'EXPIRED', // 만료됨
}

export enum SubscriptionPlan {
  LIGHT = 'LIGHT', // 라이트 (9,900원/월, 15장)
  PREMIUM = 'PREMIUM', // 프리미엄 (19,800원/월, 30장)
}

/**
 * 구독 엔티티
 */
@Entity('subscriptions')
@Index(['userId', 'status'])
@Index(['nextBillingDate', 'status'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 사용자
  @Column({ type: 'varchar', length: 36 })
  @Index()
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  // 구독 정보
  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.PREMIUM,
  })
  planId: SubscriptionPlan;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 19800.0 })
  price: number;

  // 상태
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  @Index()
  status: SubscriptionStatus;

  // 결제 정보
  @Column({ type: 'varchar', length: 100, nullable: true })
  billingKey: string | null; // Toss Payments 빌링키

  @Column({ type: 'date', nullable: true })
  @Index()
  nextBillingDate: Date | null; // 다음 결제일

  @Column({ type: 'datetime', nullable: true })
  lastBilledAt: Date | null; // 마지막 결제일

  // 타임스탬프
  @CreateDateColumn()
  startedAt: Date; // 구독 시작일

  @Column({ type: 'datetime', nullable: true })
  cancelledAt: Date | null; // 구독 취소일

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * 구독 활성화
   */
  activate(billingKey: string): void {
    this.status = SubscriptionStatus.ACTIVE;
    this.billingKey = billingKey;

    // 다음 결제일 설정 (1개월 후)
    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    this.nextBillingDate = nextBilling;

    this.lastBilledAt = new Date();
  }

  /**
   * 구독 갱신
   */
  renew(): void {
    if (this.status !== SubscriptionStatus.ACTIVE) {
      throw new Error('Cannot renew inactive subscription');
    }

    // 다음 결제일 갱신
    const nextBilling = new Date(this.nextBillingDate);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    this.nextBillingDate = nextBilling;

    this.lastBilledAt = new Date();
  }

  /**
   * 구독 취소
   */
  cancel(): void {
    this.status = SubscriptionStatus.CANCELLED;
    this.cancelledAt = new Date();
    this.billingKey = null;
    this.nextBillingDate = null;
  }

  /**
   * 구독 만료
   */
  expire(): void {
    this.status = SubscriptionStatus.EXPIRED;
  }

  /**
   * 활성 구독 여부
   */
  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  /**
   * 갱신 필요 여부
   */
  needsRenewal(): boolean {
    if (this.status !== SubscriptionStatus.ACTIVE) {
      return false;
    }

    if (!this.nextBillingDate) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.nextBillingDate <= today;
  }

  /**
   * 월 예측권 수 (플랜별)
   */
  getMonthlyTickets(): number {
    switch (this.planId) {
      case SubscriptionPlan.PREMIUM:
        return 30;
      default:
        return 30;
    }
  }
}
