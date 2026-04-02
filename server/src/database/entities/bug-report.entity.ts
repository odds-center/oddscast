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

export enum BugReportStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum BugReportCategory {
  UI = 'UI',
  PREDICTION = 'PREDICTION',
  PAYMENT = 'PAYMENT',
  LOGIN = 'LOGIN',
  NOTIFICATION = 'NOTIFICATION',
  OTHER = 'OTHER',
}

@Entity('bug_reports', { schema: 'oddscast' })
export class BugReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true, type: 'int' })
  userId!: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @Column({ length: 200 })
  title!: string;

  @Column('text')
  description!: string;

  @Column({ type: 'varchar', default: BugReportCategory.OTHER })
  category!: BugReportCategory;

  @Column({ type: 'varchar', default: BugReportStatus.OPEN })
  status!: BugReportStatus;

  @Column({ length: 500, nullable: true, type: 'varchar' })
  pageUrl!: string | null;

  @Column({ length: 500, nullable: true, type: 'varchar' })
  userAgent!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
