import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'email_verification_tokens', schema: 'oddscast' })
export class EmailVerificationToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'userId', type: 'integer' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'text' })
  token!: string;

  @Column({ name: 'expiresAt', type: 'timestamp', precision: 3 })
  expiresAt!: Date;

  @CreateDateColumn({ type: 'timestamp', precision: 3 })
  createdAt!: Date;
}
