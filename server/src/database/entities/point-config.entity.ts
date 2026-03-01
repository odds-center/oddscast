import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'point_configs', schema: 'oddscast' })
export class PointConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'configKey', type: 'text' })
  configKey!: string;

  @Column({ name: 'configValue', type: 'text' })
  configValue!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
