import {
  Column,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BaseEntity } from '../../shared/entities/base.entity';
import { User } from './user.entity';

@Entity('user_social_auth')
@Index(['userId', 'provider'], { unique: true }) // 사용자당 각 provider는 하나씩만
@Index(['provider', 'providerId'], { unique: true }) // provider + providerId 조합도 유니크
export class UserSocialAuth extends BaseEntity {
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 20 })
  provider!: string; // 'google', 'facebook', 'apple' 등

  @Column({ type: 'varchar', length: 100, name: 'provider_id' })
  providerId!: string; // Google ID (sub)

  @Column({ type: 'varchar', length: 100 })
  email!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name?: string;

  @Column({ type: 'text', name: 'access_token', nullable: true })
  accessToken?: string; // Google Access Token

  @Column({ type: 'text', name: 'refresh_token', nullable: true })
  refreshToken?: string; // Google Refresh Token

  @Column({ type: 'text', name: 'id_token', nullable: true })
  idToken?: string; // Google ID Token

  @Column({ type: 'datetime', name: 'token_expires_at', nullable: true })
  tokenExpiresAt?: Date;

  @Column({ type: 'json', name: 'raw_data', nullable: true })
  rawData?: any; // 원본 OAuth 응답 데이터

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // 관계 설정
  @ManyToOne(() => User, user => user.socialAuths)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
