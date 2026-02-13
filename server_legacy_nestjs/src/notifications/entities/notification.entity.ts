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

export enum NotificationType {
  BET_RESULT = 'BET_RESULT',
  RACE_START = 'RACE_START',
  RACE_RESULT = 'RACE_RESULT',
  PREDICTION = 'PREDICTION',
  SUBSCRIPTION = 'SUBSCRIPTION',
  SYSTEM = 'SYSTEM',
  PROMOTION = 'PROMOTION',
}

export enum NotificationCategory {
  BETTING = 'BETTING',
  RACE = 'RACE',
  PREDICTION = 'PREDICTION',
  SUBSCRIPTION = 'SUBSCRIPTION',
  SYSTEM = 'SYSTEM',
  MARKETING = 'MARKETING',
}

@Entity('notifications')
@Index(['userId', 'isRead'])
@Index(['userId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    comment: '알림 타입',
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationCategory,
    comment: '알림 카테고리',
  })
  category: NotificationCategory;

  @Column({ comment: '알림 제목' })
  title: string;

  @Column({ type: 'text', comment: '알림 내용' })
  message: string;

  @Column({
    name: 'target_id',
    nullable: true,
    comment: '관련 대상 ID (경주 ID, 베팅 ID 등)',
  })
  targetId?: string;

  @Column({
    name: 'target_type',
    nullable: true,
    comment: '관련 대상 타입 (race, bet, prediction 등)',
  })
  targetType?: string;

  @Column({
    name: 'target_data',
    type: 'json',
    nullable: true,
    comment: '추가 대상 데이터 (JSON)',
  })
  targetData?: Record<string, any>;

  @Column({ name: 'is_read', default: false, comment: '읽음 여부' })
  isRead: boolean;

  @Column({ name: 'read_at', nullable: true, comment: '읽은 시간' })
  readAt?: Date;

  @Column({ name: 'is_sent', default: false, comment: '발송 여부' })
  isSent: boolean;

  @Column({ name: 'sent_at', nullable: true, comment: '발송 시간' })
  sentAt?: Date;

  @Column({ name: 'scheduled_at', nullable: true, comment: '예약 발송 시간' })
  scheduledAt?: Date;

  @Column({
    name: 'priority',
    type: 'enum',
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    default: 'NORMAL',
    comment: '알림 우선순위',
  })
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 관계
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
