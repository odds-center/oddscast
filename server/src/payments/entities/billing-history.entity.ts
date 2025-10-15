import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BaseEntity } from '../../shared/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

/**
 * 결제 이력 Entity
 */
@Entity('billing_history')
@Index(['userId', 'billingDate'])
export class BillingHistory extends BaseEntity {
  // 구독 정보 (개별 구매 시 null)
  @Column({ name: 'subscription_id', type: 'varchar', length: 36, nullable: true })
  subscriptionId: string | null;

  @ManyToOne(() => Subscription, { nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  // 사용자 정보
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 결제 정보
  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '결제 금액' })
  amount: number;

  @Column({ name: 'billing_date', type: 'timestamp', comment: '결제 일시' })
  @Index()
  billingDate: Date;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '결제 수단',
  })
  paymentMethod: string;

  // PG사 정보
  @Column({
    name: 'pg_provider',
    type: 'varchar',
    length: 50,
    default: 'TOSS',
    comment: 'PG사',
  })
  pgProvider: string;

  @Column({
    name: 'pg_transaction_id',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'PG사 거래 ID',
  })
  @Index()
  pgTransactionId: string;

  // 결제 상태
  @Column({
    type: 'enum',
    enum: ['SUCCESS', 'FAILED', 'REFUNDED'],
    default: 'SUCCESS',
  })
  @Index()
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
    if (!this.billingDate) {
      this.billingDate = new Date();
    }
  }
}


