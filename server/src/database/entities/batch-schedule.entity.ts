import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BatchScheduleStatus } from '../db-enums';

/** Job types for batch_schedules (extend as needed). */
export const BATCH_JOB_KRA_RESULT_FETCH = 'KRA_RESULT_FETCH';

@Entity({ name: 'batch_schedules', schema: 'oddscast' })
export class BatchSchedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'jobType', type: 'text' })
  jobType!: string;

  /** Target identifier (e.g. rcDate YYYYMMDD for KRA_RESULT_FETCH). */
  @Column({ name: 'targetRcDate', type: 'text' })
  targetRcDate!: string;

  @Column({ name: 'scheduledAt', type: 'timestamp', precision: 3 })
  scheduledAt!: Date;

  @Column({ type: 'enum', enum: BatchScheduleStatus, default: BatchScheduleStatus.PENDING })
  status!: BatchScheduleStatus;

  @Column({ name: 'startedAt', type: 'timestamp', precision: 3, nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'completedAt', type: 'timestamp', precision: 3, nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'errorMessage', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
