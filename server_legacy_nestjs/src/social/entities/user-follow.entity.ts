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

@Entity('user_follows')
@Unique('idx_follower_following', ['followerId', 'followingId'])
@Index(['followerId'])
@Index(['followingId'])
@Index(['createdAt'])
export class UserFollow {
  @PrimaryColumn({ length: 36 })
  id: string;

  @Column({ name: 'follower_id', length: 36 })
  followerId: string;

  @Column({ name: 'following_id', length: 36 })
  followingId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'follower_id' })
  follower: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'following_id' })
  following: User;
}
