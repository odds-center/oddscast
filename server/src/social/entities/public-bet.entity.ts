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
import { Bet } from '../../bets/entities/bet.entity';

export enum BetVisibility {
  PUBLIC = 'PUBLIC',
  FRIENDS_ONLY = 'FRIENDS_ONLY',
  PRIVATE = 'PRIVATE',
}

export enum PublicBetResult {
  PENDING = 'PENDING',
  WIN = 'WIN',
  LOSE = 'LOSE',
  PARTIAL_WIN = 'PARTIAL_WIN',
  VOID = 'VOID',
}

@Entity('public_bets')
@Index(['userId'])
@Index(['betId'])
@Index(['raceId'])
@Index(['isPublic'])
@Index(['visibility'])
@Index(['result'])
@Index(['createdAt'], { unique: false })
export class PublicBet {
  @PrimaryColumn({ length: 36 })
  id: string;

  @Column({ name: 'user_id', length: 36 })
  userId: string;

  @Column({ name: 'bet_id', length: 36 })
  betId: string;

  @Column({ name: 'race_id', length: 100 })
  raceId: string;

  @Column({ name: 'race_name', length: 200 })
  raceName: string;

  @Column({ name: 'bet_type', length: 50 })
  betType: string;

  @Column({ name: 'bet_amount', type: 'decimal', precision: 15, scale: 0 })
  betAmount: number;

  @Column({ name: 'selected_horses', type: 'json' })
  selectedHorses: string[];

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  odds: number;

  @Column({
    type: 'enum',
    enum: PublicBetResult,
    default: PublicBetResult.PENDING,
  })
  result: PublicBetResult;

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  winnings: number;

  @Column({ name: 'is_public', type: 'boolean', default: true })
  isPublic: boolean;

  @Column({
    type: 'enum',
    enum: BetVisibility,
    default: BetVisibility.PUBLIC,
  })
  visibility: BetVisibility;

  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount: number;

  @Column({ name: 'comments_count', type: 'int', default: 0 })
  commentsCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Bet)
  @JoinColumn({ name: 'bet_id' })
  bet: Bet;
}
