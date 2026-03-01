import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'user_activity_logs', schema: 'oddscast' })
export class UserActivityLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'userId', type: 'int', nullable: true })
  userId!: number | null;

  @Column({ name: 'sessionId', type: 'text', nullable: true })
  sessionId!: string | null;

  @Column({ type: 'text' })
  event!: string;

  @Column({ type: 'text', nullable: true })
  page!: string | null;

  @Column({ type: 'text', nullable: true })
  target!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ name: 'ipAddress', type: 'text', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'userAgent', type: 'text', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;
}
