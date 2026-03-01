import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FavoriteType, FavoritePriority } from '../db-enums';
import { User } from './user.entity';

@Entity({ name: 'favorites', schema: 'oddscast' })
export class Favorite {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'userId', type: 'integer' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'enum', enum: FavoriteType })
  type!: FavoriteType;

  @Column({ name: 'targetId', type: 'text' })
  targetId!: string;

  @Column({ name: 'targetName', type: 'text' })
  targetName!: string;

  @Column({ name: 'targetData', type: 'jsonb', nullable: true })
  targetData!: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  memo!: string | null;

  @Column({
    type: 'enum',
    enum: FavoritePriority,
    default: FavoritePriority.MEDIUM,
  })
  priority!: FavoritePriority;

  @Column({ type: 'text', array: true, default: [] })
  tags!: string[];

  @Column({ type: 'boolean', default: true })
  notificationsOn!: boolean;

  @CreateDateColumn({ type: 'timestamp', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 3 })
  updatedAt!: Date;
}
