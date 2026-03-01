import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'admin_activity_logs', schema: 'oddscast' })
export class AdminActivityLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'adminUserId', type: 'int', nullable: true })
  adminUserId!: number | null;

  @Column({ name: 'adminEmail', type: 'text', nullable: true })
  adminEmail!: string | null;

  @Column({ type: 'text' })
  action!: string;

  @Column({ type: 'text', nullable: true })
  target!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, unknown> | null;

  @Column({ name: 'ipAddress', type: 'text', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'userAgent', type: 'text', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;
}
