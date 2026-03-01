import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Race } from './race.entity';

@Entity({ name: 'race_results', schema: 'oddscast' })
export class RaceResult {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'raceId', type: 'int' })
  raceId!: number;

  @Column({ type: 'text', nullable: true })
  ord!: string | null;

  @Column({ name: 'ordInt', type: 'int', nullable: true })
  ordInt!: number | null;

  @Column({ name: 'ordType', type: 'text', nullable: true })
  ordType!: string | null;

  @Column({ name: 'hrNo', type: 'text' })
  hrNo!: string;

  @Column({ name: 'hrName', type: 'text' })
  hrName!: string;

  @Column({ name: 'chulNo', type: 'text', nullable: true })
  chulNo!: string | null;

  @Column({ type: 'text', nullable: true })
  age!: string | null;

  @Column({ type: 'text', nullable: true })
  sex!: string | null;

  @Column({ name: 'jkNo', type: 'text', nullable: true })
  jkNo!: string | null;

  @Column({ name: 'jkName', type: 'text', nullable: true })
  jkName!: string | null;

  @Column({ name: 'trName', type: 'text', nullable: true })
  trName!: string | null;

  @Column({ name: 'owName', type: 'text', nullable: true })
  owName!: string | null;

  @Column({ name: 'wgBudam', type: 'float', nullable: true })
  wgBudam!: number | null;

  @Column({ name: 'wgHr', type: 'text', nullable: true })
  wgHr!: string | null;

  @Column({ name: 'hrTool', type: 'text', nullable: true })
  hrTool!: string | null;

  @Column({ name: 'rcTime', type: 'text', nullable: true })
  rcTime!: string | null;

  @Column({ name: 'diffUnit', type: 'text', nullable: true })
  diffUnit!: string | null;

  @Column({ name: 'winOdds', type: 'float', nullable: true })
  winOdds!: number | null;

  @Column({ name: 'plcOdds', type: 'float', nullable: true })
  plcOdds!: number | null;

  @Column({ type: 'text', nullable: true })
  track!: string | null;

  @Column({ type: 'text', nullable: true })
  weather!: string | null;

  @Column({ type: 'int', nullable: true })
  chaksun1!: number | null;

  @Column({ name: 'sectionalTimes', type: 'jsonb', nullable: true })
  sectionalTimes!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  @ManyToOne(() => Race, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'raceId' })
  race!: Race;
}
