import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PromotionType } from '../db-enums';

@Entity({ name: 'point_promotions', schema: 'oddscast' })
export class PointPromotion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: PromotionType })
  type!: PromotionType;

  @Column({ type: 'int' })
  points!: number;

  @Column({ type: 'jsonb', nullable: true })
  conditions!: Record<string, unknown> | null;

  @Column({ name: 'startDate', type: 'timestamp', precision: 3 })
  startDate!: Date;

  @Column({ name: 'endDate', type: 'timestamp', precision: 3 })
  endDate!: Date;

  @Column({ name: 'maxUses', type: 'int', nullable: true })
  maxUses!: number | null;

  @Column({ name: 'currentUses', type: 'int', default: 0 })
  currentUses!: number;

  @Column({ name: 'isActive', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
