import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BetType, BetStatus, BetResult } from '../db-enums';
import { User } from './user.entity';
import { Race } from './race.entity';

@Entity({ name: 'bets', schema: 'oddscast' })
export class Bet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'userId', type: 'integer' })
  userId!: number;

  @Column({ name: 'raceId', type: 'integer' })
  raceId!: number;

  @Column({ name: 'betType', type: 'enum', enum: BetType })
  betType!: BetType;

  @Column({ name: 'betName', type: 'text' })
  betName!: string;

  @Column({ name: 'betDescription', type: 'text', nullable: true })
  betDescription!: string | null;

  @Column({ name: 'betAmount', type: 'int' })
  betAmount!: number;

  @Column({ name: 'potentialWin', type: 'int', nullable: true })
  potentialWin!: number | null;

  @Column({ type: 'float', nullable: true })
  odds!: number | null;

  @Column({ type: 'jsonb' })
  selections!: Record<string, unknown>;

  @Column({
    name: 'betStatus',
    type: 'enum',
    enum: BetStatus,
    default: BetStatus.PENDING,
  })
  betStatus!: BetStatus;

  @Column({
    name: 'betResult',
    type: 'enum',
    enum: BetResult,
    default: BetResult.PENDING,
  })
  betResult!: BetResult;

  @Column({ name: 'betTime', type: 'timestamp', precision: 3 })
  betTime!: Date;

  @Column({ name: 'raceTime', type: 'timestamp', precision: 3, nullable: true })
  raceTime!: Date | null;

  @Column({
    name: 'resultTime',
    type: 'timestamp',
    precision: 3,
    nullable: true,
  })
  resultTime!: Date | null;

  @Column({ name: 'actualWin', type: 'int', nullable: true })
  actualWin!: number | null;

  @Column({ name: 'actualOdds', type: 'float', nullable: true })
  actualOdds!: number | null;

  @Column({ name: 'confidenceLevel', type: 'float', nullable: true })
  confidenceLevel!: number | null;

  @Column({ name: 'betReason', type: 'text', nullable: true })
  betReason!: string | null;

  @Column({ name: 'analysisData', type: 'jsonb', nullable: true })
  analysisData!: Record<string, unknown> | null;

  @Column({ name: 'apiVersion', type: 'text', nullable: true })
  apiVersion!: string | null;

  @Column({ name: 'dataSource', type: 'text', nullable: true })
  dataSource!: string | null;

  @Column({ name: 'ipAddress', type: 'text', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'userAgent', type: 'text', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  @Column({ type: 'float', nullable: true })
  roi!: number | null;

  @Column({ name: 'riskLevel', type: 'text', nullable: true })
  riskLevel!: string | null;

  @Column({ name: 'isFavorite', type: 'boolean', default: false })
  isFavorite!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => Race, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'raceId' })
  race?: Race;
}
