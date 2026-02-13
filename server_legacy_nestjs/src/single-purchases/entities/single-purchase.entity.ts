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
import { PredictionTicket } from '../../prediction-tickets/entities/prediction-ticket.entity';

export enum PurchaseStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

/**
 * 개별 구매 엔티티 (₩1,100/장)
 */
@Entity('single_purchases')
@Index(['userId', 'purchasedAt'])
export class SinglePurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 사용자
  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 예측권
  @Column({ type: 'varchar', length: 36, name: 'ticket_id' })
  ticketId: string;

  @ManyToOne(() => PredictionTicket, { nullable: true })
  @JoinColumn({ name: 'ticket_id' })
  ticket: PredictionTicket;

  // 가격 정보 (VAT 포함)
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 1000.0,
    name: 'original_price',
  })
  originalPrice: number; // 원가 (VAT 전)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 100.0 })
  vat: number; // 부가세 (10%)

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 1100.0,
    name: 'total_price',
  })
  totalPrice: number; // 최종 가격

  // 결제 정보
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'pg_transaction_id',
  })
  pgTransactionId: string | null; // PG사 거래 ID

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'payment_method',
  })
  paymentMethod: string | null; // CARD, KAKAOPAY, NAVERPAY 등

  // 상태
  @Column({
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.SUCCESS,
  })
  @Index()
  status: PurchaseStatus;

  // 타임스탬프
  @CreateDateColumn({ name: 'purchased_at' })
  @Index()
  purchasedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * 환불 처리
   */
  refund(): void {
    if (this.status !== PurchaseStatus.SUCCESS) {
      throw new Error('Can only refund successful purchases');
    }

    this.status = PurchaseStatus.REFUNDED;
  }
}
