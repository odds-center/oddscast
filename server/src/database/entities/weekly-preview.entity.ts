import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'weekly_previews', schema: 'oddscast' })
export class WeeklyPreview {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'weekLabel', type: 'text' })
  weekLabel!: string;

  @Column({ type: 'jsonb' })
  content!: Record<string, unknown>;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
