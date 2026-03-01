import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TicketType, TicketStatus } from '../db-enums';
import { User } from './user.entity';
import { Prediction } from './prediction.entity';
import { Race } from './race.entity';

@Entity({ name: 'prediction_tickets', schema: 'oddscast' })
export class PredictionTicket {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'userId', type: 'integer' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'integer', nullable: true })
  subscriptionId!: number | null;

  @Column({ type: 'integer', nullable: true })
  predictionId!: number | null;

  @ManyToOne(() => Prediction, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'predictionId' })
  prediction?: Prediction | null;

  @Column({ type: 'integer', nullable: true })
  raceId!: number | null;

  @ManyToOne(() => Race, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'raceId' })
  race?: Race | null;

  @Column({ type: 'enum', enum: TicketType, default: TicketType.RACE })
  type!: TicketType;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.AVAILABLE })
  status!: TicketStatus;

  @Column({ type: 'timestamp', precision: 3, nullable: true })
  usedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  matrixDate!: string | null;

  @Column({ type: 'timestamp', precision: 3 })
  issuedAt!: Date;

  @Column({ type: 'timestamp', precision: 3 })
  expiresAt!: Date;
}
