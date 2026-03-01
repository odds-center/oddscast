import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'admin_users', schema: 'oddscast' })
export class AdminUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'loginId', type: 'text' })
  loginId!: string;

  @Column({ type: 'text' })
  password!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp', precision: 3, nullable: true })
  lastLoginAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 3 })
  updatedAt!: Date;
}
