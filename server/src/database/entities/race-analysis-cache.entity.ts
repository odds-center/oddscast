import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Race } from './race.entity';

@Entity({ name: 'race_analysis_cache', schema: 'oddscast' })
@Unique(['raceId', 'analysisType'])
export class RaceAnalysisCache {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  raceId!: number;

  @Column({ type: 'text' })
  analysisType!: string;

  @Column({ type: 'text' })
  dataHash!: string;

  @Column({ type: 'jsonb' })
  result!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Race, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'raceId' })
  race!: Race;
}
