import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReferralCode } from './referral-code.entity';
import { User } from './user.entity';

@Entity({ name: 'referral_claims', schema: 'oddscast' })
export class ReferralClaim {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'referralCodeId', type: 'int' })
  referralCodeId!: number;

  @Column({ name: 'referredUserId', type: 'int' })
  referredUserId!: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @ManyToOne(() => ReferralCode, (code) => code.claims, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referralCodeId' })
  referralCode!: ReferralCode;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referredUserId' })
  referredUser!: User;
}
