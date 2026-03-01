import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'single_purchases', schema: 'oddscast' })
export class SinglePurchase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'userId', type: 'integer' })
  userId!: number;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ name: 'totalAmount', type: 'int' })
  totalAmount!: number;

  @Column({ name: 'paymentMethod', type: 'text', nullable: true })
  paymentMethod!: string | null;

  @Column({ name: 'pgTransactionId', type: 'text', nullable: true })
  pgTransactionId!: string | null;

  @Column({ name: 'purchasedAt', type: 'timestamp', precision: 3 })
  purchasedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
