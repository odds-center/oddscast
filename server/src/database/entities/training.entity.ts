import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RaceEntry } from './race-entry.entity';

@Entity({ name: 'trainings', schema: 'oddscast' })
export class Training {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'raceEntryId', type: 'int', nullable: true })
  raceEntryId!: number | null;

  @Column({ name: 'horseNo', type: 'text' })
  horseNo!: string;

  @Column({ name: 'trDate', type: 'text' })
  trDate!: string;

  @Column({ name: 'trTime', type: 'text', nullable: true })
  trTime!: string | null;

  @Column({ name: 'trEndTime', type: 'text', nullable: true })
  trEndTime!: string | null;

  @Column({ name: 'trDuration', type: 'text', nullable: true })
  trDuration!: string | null;

  @Column({ name: 'trContent', type: 'text', nullable: true })
  trContent!: string | null;

  @Column({ name: 'trType', type: 'text', nullable: true })
  trType!: string | null;

  @Column({ name: 'managerType', type: 'text', nullable: true })
  managerType!: string | null;

  @Column({ name: 'managerName', type: 'text', nullable: true })
  managerName!: string | null;

  @Column({ type: 'text', nullable: true })
  place!: string | null;

  @Column({ type: 'text', nullable: true })
  weather!: string | null;

  @Column({ name: 'trackCondition', type: 'text', nullable: true })
  trackCondition!: string | null;

  @Column({ type: 'text', nullable: true })
  course!: string | null;

  @Column({ type: 'text', nullable: true })
  intensity!: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  @ManyToOne(() => RaceEntry, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'raceEntryId' })
  raceEntry!: RaceEntry | null;
}
