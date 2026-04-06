import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Race } from './race.entity';

@Entity('community_predictions', { schema: 'oddscast' })
@Unique(['userId', 'raceId'])
export class CommunityPrediction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  @Index()
  userId!: number;

  @Column({ name: 'race_id' })
  @Index()
  raceId!: number;

  // Up to 3 horse numbers in predicted order
  @Column('text', { name: 'predicted_hr_nos', array: true })
  predictedHrNos!: string[];

  // 0-3 matching actual top-3 finishers
  @Column({ default: 0 })
  score!: number;

  @Column({ name: 'scored_at', nullable: true, type: 'timestamp' })
  scoredAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Race, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'race_id' })
  race!: Race;
}
