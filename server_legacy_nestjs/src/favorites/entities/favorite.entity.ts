import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum FavoriteType {
  HORSE = 'HORSE',
  JOCKEY = 'JOCKEY',
  TRAINER = 'TRAINER',
  RACE = 'RACE',
}

@Entity('favorites')
@Index(['userId', 'type', 'targetId'], { unique: true })
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: FavoriteType,
    comment: '즐겨찾기 타입 (HORSE, JOCKEY, TRAINER, RACE)',
  })
  type: FavoriteType;

  @Column({ name: 'target_id', comment: '대상 ID (말 ID, 기수 ID 등)' })
  targetId: string;

  @Column({ name: 'target_name', comment: '대상 이름' })
  targetName: string;

  @Column({
    name: 'target_data',
    type: 'json',
    nullable: true,
    comment: '추가 대상 데이터 (JSON)',
  })
  targetData?: Record<string, any>;

  @Column({ name: 'notes', type: 'text', nullable: true, comment: '메모' })
  notes?: string;

  @Column({ name: 'tags', type: 'json', nullable: true, comment: '태그 목록' })
  tags?: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 관계
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
