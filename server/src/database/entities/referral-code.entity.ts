import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'referral_codes', schema: 'oddscast' })
export class ReferralCode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'text', unique: true })
  code!: string;

  @Column({ type: 'int', default: 0 })
  usedCount!: number;

  @Column({ type: 'int', default: 10 })
  maxUses!: number;

  @CreateDateColumn({ type: 'timestamp', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 3 })
  updatedAt!: Date;
}
