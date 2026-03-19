import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Race } from './race.entity';

@Entity({ name: 'race_entries', schema: 'oddscast' })
export class RaceEntry {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'raceId', type: 'int' })
  raceId!: number;

  @Column({ name: 'hrNo', type: 'text' })
  hrNo!: string;

  @Column({ name: 'hrName', type: 'text' })
  hrName!: string;

  @Column({ name: 'hrNameEn', type: 'text', nullable: true })
  hrNameEn!: string | null;

  @Column({ name: 'jkNo', type: 'text', nullable: true })
  jkNo!: string | null;

  @Column({ name: 'jkName', type: 'text' })
  jkName!: string;

  @Column({ name: 'jkNameEn', type: 'text', nullable: true })
  jkNameEn!: string | null;

  @Column({ name: 'trNo', type: 'text', nullable: true })
  trNo!: string | null;

  @Column({ name: 'trName', type: 'text', nullable: true })
  trName!: string | null;

  @Column({ name: 'owNo', type: 'text', nullable: true })
  owNo!: string | null;

  @Column({ name: 'owName', type: 'text', nullable: true })
  owName!: string | null;

  @Column({ name: 'wgBudam', type: 'float', nullable: true })
  wgBudam!: number | null;

  @Column({ type: 'float', nullable: true })
  rating!: number | null;

  @Column({ name: 'chulNo', type: 'text', nullable: true })
  chulNo!: string | null;

  @Column({ type: 'int', nullable: true })
  dusu!: number | null;

  @Column({ type: 'text', nullable: true })
  sex!: string | null;

  @Column({ type: 'int', nullable: true })
  age!: number | null;

  @Column({ type: 'text', nullable: true })
  prd!: string | null;

  @Column({ type: 'int', nullable: true })
  chaksun1!: number | null;

  @Column({ name: 'chaksunT', type: 'bigint', nullable: true })
  chaksunT!: string | null;

  @Column({ name: 'rcCntT', type: 'int', nullable: true })
  rcCntT!: number | null;

  @Column({ name: 'ord1CntT', type: 'int', nullable: true })
  ord1CntT!: number | null;

  @Column({ type: 'text', nullable: true })
  budam!: string | null;

  @Column({ name: 'ratingHistory', type: 'jsonb', nullable: true })
  ratingHistory!: number[] | null;

  @Column({ name: 'recentRanks', type: 'jsonb', nullable: true })
  recentRanks!: number[] | null;

  @Column({ name: 'trainingData', type: 'jsonb', nullable: true })
  trainingData!: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  equipment!: string | null;

  @Column({ name: 'horseWeight', type: 'text', nullable: true })
  horseWeight!: string | null;

  @Column({ name: 'bleedingInfo', type: 'jsonb', nullable: true })
  bleedingInfo!: Record<string, unknown> | null;

  @Column({ name: 'isScratched', type: 'boolean', default: false })
  isScratched!: boolean;

  @Column({ name: 'sectionalStats', type: 'jsonb', nullable: true })
  sectionalStats!: Record<string, unknown> | null;

  @ManyToOne(() => Race, (race) => race.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'raceId' })
  race!: Race;
}
