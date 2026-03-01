import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PointTransactionType, PointStatus } from '../db-enums';
import { User } from './user.entity';

@Entity({ name: 'point_transactions', schema: 'oddscast' })
export class PointTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'userId', type: 'integer' })
  userId!: number;

  @Column({ name: 'transactionType', type: 'enum', enum: PointTransactionType })
  transactionType!: PointTransactionType;

  @Column({ type: 'int' })
  amount!: number;

  @Column({ name: 'balanceAfter', type: 'int' })
  balanceAfter!: number;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: PointStatus, default: PointStatus.ACTIVE })
  status!: PointStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ name: 'transactionTime', type: 'timestamp', precision: 3 })
  transactionTime!: Date;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
