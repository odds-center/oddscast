import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'global_config', schema: 'oddscast' })
export class GlobalConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  key!: string;

  @Column({ type: 'text' })
  value!: string;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
