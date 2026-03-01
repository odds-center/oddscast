import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_notification_preferences', schema: 'oddscast' })
export class UserNotificationPreference {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'userId', type: 'integer', unique: true })
  userId!: number;

  @Column({ type: 'boolean', default: true })
  pushEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  raceEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  predictionEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  subscriptionEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  systemEnabled!: boolean;

  @Column({ type: 'boolean', default: false })
  promotionEnabled!: boolean;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
