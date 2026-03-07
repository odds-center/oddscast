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

/**
 * Confirmed payout dividends per race per pool type.
 * Source: KRA API160/integratedInfo — fetched after race results are loaded.
 * Pool codes: WIN(단승식), PLC(연승식), QNL(복승식), EXA(쌍승식),
 *             QPL(복연승식), TLA(삼복승식), TRI(삼쌍승식)
 */
@Entity({ name: 'race_dividends', schema: 'oddscast' })
@Unique(['raceId', 'pool', 'chulNo', 'chulNo2', 'chulNo3'])
export class RaceDividend {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'raceId', type: 'int' })
  raceId!: number;

  /** KRA pool code: WIN, PLC, QNL, EXA, QPL, TLA, TRI */
  @Column({ type: 'text' })
  pool!: string;

  /** Korean pool name as returned by KRA: 단승식, 연승식, 복승식, etc. */
  @Column({ name: 'poolName', type: 'text' })
  poolName!: string;

  /** 1st horse gate number */
  @Column({ name: 'chulNo', type: 'text' })
  chulNo!: string;

  /** 2nd horse gate number (empty string when not applicable) */
  @Column({ name: 'chulNo2', type: 'text', default: '' })
  chulNo2!: string;

  /** 3rd horse gate number (empty string when not applicable) */
  @Column({ name: 'chulNo3', type: 'text', default: '' })
  chulNo3!: string;

  /** Final confirmed payout odds */
  @Column({ type: 'float' })
  odds!: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  @ManyToOne(() => Race, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'raceId' })
  race!: Race;
}
