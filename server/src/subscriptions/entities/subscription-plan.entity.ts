import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PlanName {
  LIGHT = 'LIGHT',
  PREMIUM = 'PREMIUM',
}

/**
 * 구독 플랜 엔티티
 * - 라이트: ₩9,900 (10+1장)
 * - 프리미엄: ₩19,800 (20+4장)
 */
@Entity('subscription_plans')
export class SubscriptionPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'plan_name' })
  @Index()
  planName: string; // LIGHT, PREMIUM

  @Column({ type: 'varchar', length: 100, name: 'display_name' })
  displayName: string; // 라이트 플랜, 프리미엄 플랜

  @Column({ type: 'text', nullable: true })
  description: string; // 플랜 설명

  // 가격 정보
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'original_price' })
  originalPrice: number; // 원가 (VAT 전)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  vat: number; // 부가세 (10%)

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number; // 최종 가격 (VAT 포함)

  // 예측권 구성
  @Column({ type: 'int', name: 'base_tickets' })
  baseTickets: number; // 기본 예측권

  @Column({ type: 'int', default: 0, name: 'bonus_tickets' })
  bonusTickets: number; // 보너스 예측권

  @Column({ type: 'int', name: 'total_tickets' })
  totalTickets: number; // 총 예측권 (base + bonus)

  // 상태
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  isActive: boolean;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * 개별 구매 대비 절약 금액 계산
   */
  getMonthlySavings(): number {
    const SINGLE_PRICE = 1100; // 개별 구매 가격 (VAT 포함)
    const totalIndividualPrice = SINGLE_PRICE * this.totalTickets;
    return totalIndividualPrice - this.totalPrice;
  }

  /**
   * 할인율 계산
   */
  getDiscountPercentage(): number {
    const SINGLE_PRICE = 1100;
    const totalIndividualPrice = SINGLE_PRICE * this.totalTickets;
    return Math.round(
      ((totalIndividualPrice - this.totalPrice) / totalIndividualPrice) * 100
    );
  }

  /**
   * 장당 가격 계산
   */
  getPricePerTicket(): number {
    return Math.round(this.totalPrice / this.totalTickets);
  }
}
