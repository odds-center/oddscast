import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RankingType {
  OVERALL = 'OVERALL',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

@Entity('user_rankings')
@Index(['userId', 'rankingType', 'periodStart'], { unique: true })
@Index(['rankingType'])
@Index(['rankPosition'])
@Index(['score'], { unique: false })
export class UserRanking {
  @PrimaryColumn({ length: 36 })
  id: string;

  @Column({ name: 'user_id', length: 36 })
  userId: string;

  @Column({
    name: 'ranking_type',
    type: 'enum',
    enum: RankingType,
  })
  rankingType: RankingType;

  @Column({ name: 'rank_position', type: 'int' })
  rankPosition: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  score: number;

  @Column({ name: 'total_bets', type: 'int', default: 0 })
  totalBets: number;

  @Column({ name: 'won_bets', type: 'int', default: 0 })
  wonBets: number;

  @Column({
    name: 'win_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  winRate: number;

  @Column({
    name: 'total_winnings',
    type: 'decimal',
    precision: 15,
    scale: 0,
    default: 0,
  })
  totalWinnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  roi: number;

  @Column({ name: 'period_start', type: 'date' })
  periodStart: Date;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
