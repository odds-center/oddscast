import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PredictionStatus } from '../db-enums';
import { Race } from './race.entity';

@Entity({ name: 'predictions', schema: 'oddscast' })
export class Prediction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'raceId', type: 'int' })
  raceId!: number;

  @Column({ type: 'jsonb', nullable: true })
  scores!: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  analysis!: string | null;

  @Column({ type: 'text', nullable: true })
  preview!: string | null;

  @Column({ name: 'previewApproved', type: 'boolean', default: false })
  previewApproved!: boolean;

  @Column({ type: 'float', nullable: true })
  accuracy!: number | null;

  @Column({ name: 'postRaceSummary', type: 'text', nullable: true })
  postRaceSummary!: string | null;

  /**
   * SHA-256 hash (first 16 hex chars) of the entry sheet used to generate this prediction.
   * Used to detect whether a cached prediction can be reused without re-calling Gemini.
   * Hashed fields: hrNo, jkNo, chulNo, wgBudam, rating (sorted by hrNo).
   */
  @Column({ name: 'entriesHash', type: 'text', nullable: true })
  entriesHash!: string | null;

  @Column({
    type: 'enum',
    enum: PredictionStatus,
    default: PredictionStatus.PENDING,
  })
  status!: PredictionStatus;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  @ManyToOne(() => Race, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'raceId' })
  race!: Race;
}
