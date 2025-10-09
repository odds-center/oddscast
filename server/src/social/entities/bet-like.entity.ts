import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PublicBet } from './public-bet.entity';

@Entity('bet_likes')
@Unique('idx_user_bet', ['userId', 'publicBetId'])
@Index(['publicBetId'])
@Index(['createdAt'])
export class BetLike {
  @PrimaryColumn({ length: 36 })
  id: string;

  @Column({ name: 'user_id', length: 36 })
  userId: string;

  @Column({ name: 'public_bet_id', length: 36 })
  publicBetId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => PublicBet)
  @JoinColumn({ name: 'public_bet_id' })
  publicBet: PublicBet;
}
