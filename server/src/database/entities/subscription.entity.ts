import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SubscriptionStatus } from '../db-enums';
import { User } from './user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

@Entity({ name: 'subscriptions', schema: 'oddscast' })
export class Subscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'userId', type: 'integer' })
  userId!: number;

  @Column({ name: 'planId', type: 'integer' })
  planId!: number;

  @Column({ type: 'int' })
  price!: number;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.PENDING })
  status!: SubscriptionStatus;

  @Column({ name: 'customerKey', type: 'text', nullable: true })
  customerKey!: string | null;

  @Column({ name: 'billingKey', type: 'text', nullable: true })
  billingKey!: string | null;

  @Column({ name: 'nextBillingDate', type: 'timestamp', precision: 3, nullable: true })
  nextBillingDate!: Date | null;

  @Column({ name: 'lastBilledAt', type: 'timestamp', precision: 3, nullable: true })
  lastBilledAt!: Date | null;

  @Column({ name: 'startedAt', type: 'timestamp', precision: 3 })
  startedAt!: Date;

  @Column({ name: 'cancelledAt', type: 'timestamp', precision: 3, nullable: true })
  cancelledAt!: Date | null;

  @Column({ name: 'cancelReason', type: 'text', nullable: true })
  cancelReason!: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => SubscriptionPlan, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'planId' })
  plan?: SubscriptionPlan;
}
