import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum FavoriteType {
  RACE = 'RACE',
  HORSE = 'HORSE',
  JOCKEY = 'JOCKEY',
  TRAINER = 'TRAINER',
  MEET = 'MEET',
}

export enum FavoritePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity('favorites')
@Unique(['userId', 'type', 'targetId'])
@Index(['userId'])
@Index(['type'])
@Index(['targetId'])
@Index(['priority'])
@Index(['createdAt'])
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Column({
    type: 'enum',
    enum: FavoriteType,
  })
  type: FavoriteType;

  @Column({ name: 'target_id', type: 'varchar', length: 50 })
  targetId: string;

  @Column({ name: 'target_name', type: 'varchar', length: 255 })
  targetName: string;

  @Column({ name: 'target_data', type: 'json', nullable: true })
  targetData: any;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: FavoritePriority,
    default: FavoritePriority.MEDIUM,
  })
  priority: FavoritePriority;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
