import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 구독 플랜 엔티티
 */
@Entity('subscription_plans')
export class SubscriptionPlanEntity {
  @PrimaryColumn({ type: 'varchar', length: 20, name: 'plan_id' })
  planId: string; // LIGHT, PREMIUM

  @Column({ type: 'varchar', length: 50 })
  name: string; // 라이트 구독, 프리미엄 구독

  @Column({ type: 'text', nullable: true })
  description: string; // 플랜 설명

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // 월 가격

  @Column({ type: 'int', name: 'tickets_per_month' })
  ticketsPerMonth: number; // 월 예측권 수량

  @Column({ type: 'decimal', precision: 8, scale: 2, name: 'price_per_ticket' })
  pricePerTicket: number; // 장당 가격

  @Column({ type: 'int', default: 0, name: 'discount_percentage' })
  discountPercentage: number; // 할인율

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean; // 활성화 여부

  @Column({ type: 'boolean', default: false, name: 'is_recommended' })
  isRecommended: boolean; // 추천 플랜 여부

  @Column({ type: 'json', nullable: true })
  features: string[]; // 포함 기능들

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * 개별 구매 대비 절약 금액 계산
   */
  getMonthlySavings(): number {
    const individualPrice = 1000; // 개별 구매 가격
    const totalIndividualPrice = individualPrice * this.ticketsPerMonth;
    return totalIndividualPrice - this.price;
  }

  /**
   * 할인율 계산
   */
  getDiscountPercentage(): number {
    const individualPrice = 1000;
    const totalIndividualPrice = individualPrice * this.ticketsPerMonth;
    return Math.round(
      ((totalIndividualPrice - this.price) / totalIndividualPrice) * 100
    );
  }
}
