import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PickType } from '../db-enums';
import { User } from './user.entity';
import { Race } from './race.entity';

@Entity({ name: 'user_picks', schema: 'oddscast' })
export class UserPick {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'userId', type: 'integer' })
  userId!: number;

  @Column({ name: 'raceId', type: 'integer' })
  raceId!: number;

  @Column({ name: 'pickType', type: 'enum', enum: PickType })
  pickType!: PickType;

  @Column({ name: 'hrNos', type: 'text', array: true, nullable: true })
  hrNos!: string[] | null;

  @Column({ name: 'hrNames', type: 'text', array: true, nullable: true })
  hrNames!: string[] | null;

  @Column({ name: 'pointsAwarded', type: 'int', default: 0, nullable: true })
  pointsAwarded!: number | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => Race, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'raceId' })
  race?: Race;
}
