import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'subscription_plans', schema: 'oddscast' })
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'planName', type: 'text' })
  planName!: string;

  @Column({ name: 'displayName', type: 'text' })
  displayName!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'originalPrice', type: 'int' })
  originalPrice!: number;

  @Column({ type: 'int' })
  vat!: number;

  @Column({ name: 'totalPrice', type: 'int' })
  totalPrice!: number;

  @Column({ name: 'baseTickets', type: 'int' })
  baseTickets!: number;

  @Column({ name: 'bonusTickets', type: 'int', default: 0 })
  bonusTickets!: number;

  @Column({ name: 'totalTickets', type: 'int' })
  totalTickets!: number;

  @Column({ name: 'matrixTickets', type: 'int', default: 0 })
  matrixTickets!: number;

  @Column({ name: 'isActive', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'sortOrder', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
