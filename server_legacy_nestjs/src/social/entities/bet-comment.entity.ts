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
import { PublicBet } from './public-bet.entity';

@Entity('bet_comments')
@Index(['userId'])
@Index(['publicBetId'])
@Index(['parentCommentId'])
@Index(['createdAt'], { unique: false })
export class BetComment {
  @PrimaryColumn({ length: 36 })
  id: string;

  @Column({ name: 'user_id', length: 36 })
  userId: string;

  @Column({ name: 'public_bet_id', length: 36 })
  publicBetId: string;

  @Column({ name: 'parent_comment_id', length: 36, nullable: true })
  parentCommentId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => PublicBet)
  @JoinColumn({ name: 'public_bet_id' })
  publicBet: PublicBet;

  @ManyToOne(() => BetComment, { nullable: true })
  @JoinColumn({ name: 'parent_comment_id' })
  parentComment: BetComment;
}
