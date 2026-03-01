import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { ReferralClaim } from './referral-claim.entity';

@Entity({ name: 'referral_codes', schema: 'oddscast' })
export class ReferralCode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'userId', type: 'int' })
  userId!: number;

  @Column({ type: 'text' })
  code!: string;

  @Column({ name: 'usedCount', type: 'int', default: 0 })
  usedCount!: number;

  @Column({ name: 'maxUses', type: 'int', default: 10 })
  maxUses!: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => ReferralClaim, (claim) => claim.referralCode)
  claims!: ReferralClaim[];
}
