import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('races')
export class Race {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id!: string;

  @Column({ type: 'int', name: 'race_number' })
  raceNumber!: number;

  @Column({ type: 'varchar', length: 255, name: 'race_name' })
  raceName!: string;

  @Column({ type: 'datetime' })
  date!: Date;

  @Column({ type: 'varchar', length: 100 })
  venue!: string;

  @Column({ type: 'varchar', length: 36, name: 'created_by', nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // 관계 설정
  @ManyToOne(() => User, user => user.createdRaces)
  @JoinColumn({ name: 'created_by' })
  user?: User;
}
