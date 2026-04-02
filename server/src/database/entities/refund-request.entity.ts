import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { BillingHistory } from './billing-history.entity';
import { Subscription } from './subscription.entity';

export enum RefundRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum RefundRequestType {
  SUBSCRIPTION = 'SUBSCRIPTION',
  SINGLE_PURCHASE = 'SINGLE_PURCHASE',
}

@Entity('refund_requests', { schema: 'oddscast' })
export class RefundRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @Column({ type: 'varchar', default: RefundRequestType.SUBSCRIPTION })
  type!: RefundRequestType;

  /** FK to BillingHistory (nullable for future single-purchase support) */
  @Column({ type: 'int', nullable: true })
  billingHistoryId!: number | null;

  @ManyToOne(() => BillingHistory, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'billingHistoryId' })
  billingHistory!: BillingHistory | null;

  /** FK to Subscription (int PK, nullable for single-purchase refunds) */
  @Column({ type: 'int', nullable: true })
  subscriptionId!: number | null;

  @ManyToOne(() => Subscription, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subscriptionId' })
  subscription!: Subscription | null;

  @Column({ type: 'varchar', default: RefundRequestStatus.PENDING })
  status!: RefundRequestStatus;

  /** Original payment amount in Korean won */
  @Column({ type: 'int' })
  originalAmount!: number;

  /** Calculated refundable amount based on unused tickets ratio */
  @Column({ type: 'int' })
  requestedAmount!: number;

  /** Actual approved amount (admin can adjust downward) */
  @Column({ type: 'int', nullable: true })
  approvedAmount!: number | null;

  @Column({ type: 'int', default: 0 })
  usedTickets!: number;

  @Column({ type: 'int', default: 0 })
  totalTickets!: number;

  @Column({ type: 'int' })
  daysSincePayment!: number;

  /** Pre-calculated eligibility flag based on policy rules */
  @Column({ type: 'boolean', default: true })
  isEligible!: boolean;

  /** Reason why the request is ineligible (null when eligible) */
  @Column({ type: 'text', nullable: true })
  ineligibilityReason!: string | null;

  /** User-provided reason for the refund request (min 10 chars) */
  @Column({ type: 'text' })
  userReason!: string;

  /** Admin note or rejection reason */
  @Column({ type: 'text', nullable: true })
  adminNote!: string | null;

  @Column({ type: 'int', nullable: true })
  processedByAdminId!: number | null;

  @Column({ type: 'timestamp', nullable: true })
  processedAt!: Date | null;

  /** TossPayments paymentKey used for the cancel API call */
  @Column({ type: 'varchar', nullable: true })
  pgTransactionId!: string | null;

  /** Raw Toss cancel response stored as JSON string */
  @Column({ type: 'text', nullable: true })
  pgRefundResponse!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
