import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_daily_fortunes', schema: 'oddscast' })
export class UserDailyFortune {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'userId', type: 'int' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'text' })
  date!: string;

  @Column({ name: 'messageOverall', type: 'text' })
  messageOverall!: string;

  @Column({ name: 'messageRace', type: 'text' })
  messageRace!: string;

  @Column({ name: 'messageAdvice', type: 'text' })
  messageAdvice!: string;

  @Column({ name: 'luckyNumbers', type: 'jsonb' })
  luckyNumbers!: unknown;

  @Column({ name: 'luckyColor', type: 'text' })
  luckyColor!: string;

  @Column({ name: 'luckyColorHex', type: 'text', nullable: true })
  luckyColorHex!: string | null;

  @Column({ type: 'text', nullable: true })
  keyword!: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
