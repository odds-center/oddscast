import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
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
 * 개별 구매 엔티티 (1,000원/장)
 */
@Entity('single_purchases')
@Index(['userId', 'purchasedAt'])
export class SinglePurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 사용자
  @Column({ type: 'varchar', length: 36 })
  @Index()
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  // 예측권
  @Column({ type: 'varchar', length: 36 })
  ticketId: string;

  @ManyToOne(() => PredictionTicket, { nullable: true })
  @JoinColumn({ name: 'ticketId' })
  ticket: PredictionTicket;

  // 결제 정보
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1000.0 })
  amount: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  pgTransactionId: string | null; // PG사 거래 ID

  @Column({ type: 'varchar', length: 20, nullable: true })
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
  @CreateDateColumn()
  @Index()
  purchasedAt: Date;

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

