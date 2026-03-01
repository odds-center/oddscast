import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'kra_sync_logs', schema: 'oddscast' })
export class KraSyncLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  endpoint!: string;

  @Column({ type: 'text', nullable: true })
  meet!: string | null;

  @Column({ name: 'rcDate', type: 'text', nullable: true })
  rcDate!: string | null;

  @Column({ type: 'text' })
  status!: string;

  @Column({ name: 'recordCount', type: 'int', default: 0 })
  recordCount!: number;

  @Column({ name: 'errorMessage', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'durationMs', type: 'int', nullable: true })
  durationMs!: number | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;
}
