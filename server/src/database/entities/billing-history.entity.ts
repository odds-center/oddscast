import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentStatus } from '../db-enums';
import { User } from './user.entity';

@Entity({ name: 'billing_histories', schema: 'oddscast' })
export class BillingHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'userId', type: 'integer' })
  userId!: number;

  @Column({ type: 'int' })
  amount!: number;

  @Column({ name: 'billingDate', type: 'timestamp', precision: 3 })
  billingDate!: Date;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.SUCCESS })
  status!: PaymentStatus;

  @Column({ name: 'pgProvider', type: 'text', nullable: true })
  pgProvider!: string | null;

  @Column({ name: 'pgTransactionId', type: 'text', nullable: true })
  pgTransactionId!: string | null;

  @Column({ name: 'errorMessage', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
