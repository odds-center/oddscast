import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RaceStatus } from '../db-enums';
import { RaceEntry } from './race-entry.entity';

@Entity({ name: 'races', schema: 'oddscast' })
export class Race {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'rcName', type: 'text', nullable: true })
  rcName!: string | null;

  @Column({ type: 'text' })
  meet!: string;

  @Column({ name: 'meetName', type: 'text', nullable: true })
  meetName!: string | null;

  @Column({ name: 'rcDate', type: 'text' })
  rcDate!: string;

  @Column({ name: 'rcDay', type: 'text', nullable: true })
  rcDay!: string | null;

  @Column({ name: 'rcNo', type: 'text' })
  rcNo!: string;

  @Column({ name: 'stTime', type: 'text', nullable: true })
  stTime!: string | null;

  @Column({ name: 'rcDist', type: 'text', nullable: true })
  rcDist!: string | null;

  @Column({ type: 'text', nullable: true })
  rank!: string | null;

  @Column({ name: 'rcCondition', type: 'text', nullable: true })
  rcCondition!: string | null;

  @Column({ name: 'rcPrize', type: 'int', nullable: true })
  rcPrize!: number | null;

  @Column({ type: 'text', nullable: true })
  weather!: string | null;

  @Column({ type: 'text', nullable: true })
  track!: string | null;

  @Column({ type: 'enum', enum: RaceStatus, default: RaceStatus.SCHEDULED })
  status!: RaceStatus;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  @OneToMany(() => RaceEntry, (entry) => entry.race)
  entries!: RaceEntry[];
}
