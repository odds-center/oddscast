import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../db-enums';

@Entity({ name: 'users', schema: 'oddscast' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  email!: string;

  @Column({ type: 'text', nullable: true })
  password!: string | null;

  @Column({ type: 'text', default: 'email' })
  provider!: string;

  @Column({ type: 'text', nullable: true })
  kakaoId!: string | null;

  @Column({ type: 'text', default: '사용자' })
  nickname!: string;

  @Column({ type: 'text', nullable: true })
  avatar!: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  isEmailVerified!: boolean;

  @Column({ type: 'timestamp', precision: 3, nullable: true })
  lastLoginAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  favoriteMeet!: string | null;

  @Column({ type: 'boolean', default: false })
  hasSeenOnboarding!: boolean;

  @Column({ type: 'text', array: true, default: '{}' })
  completedTours!: string[];

  @CreateDateColumn({ type: 'timestamp', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 3 })
  updatedAt!: Date;
}
