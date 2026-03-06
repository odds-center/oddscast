import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'referral_claims', schema: 'oddscast' })
export class ReferralClaim {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  referralCodeId!: number;

  @Column({ type: 'int', unique: true })
  referredUserId!: number;

  @CreateDateColumn({ type: 'timestamp', precision: 3 })
  createdAt!: Date;
}
