import {
  Column,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Bet } from '../../bets/entities/bet.entity';
import { UserPointBalance } from '../../points/entities/user-point-balance.entity';
import { UserPoints } from '../../points/entities/user-points.entity';
import { Race } from '../../races/entities/race.entity';
import { UserSocialAuth } from './user-social-auth.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

@Entity('users')
export class User extends BaseEntity {
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  email!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar?: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'auth_provider',
    default: 'google',
  })
  authProvider!: string;

  @Column({ type: 'varchar', length: 100, name: 'provider_id', nullable: true })
  providerId?: string;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', name: 'is_verified', default: false })
  isVerified!: boolean;

  @Column({ type: 'datetime', name: 'last_login', nullable: true })
  lastLogin?: Date;

  @Column({ type: 'varchar', length: 20, name: 'role', default: 'user' })
  role!: string;

  @Column({ type: 'json', name: 'preferences', nullable: true })
  preferences?: {
    theme?: string;
    language?: string;
    notifications?: boolean;
    favoriteMeets?: string[];
    bettingPreferences?: {
      defaultBetAmount?: number;
      favoriteBetTypes?: string[];
      riskTolerance?: string;
    };
  };

  // 베팅 통계
  @Column({ type: 'int', name: 'total_bets', default: 0 })
  totalBets!: number;

  @Column({ type: 'int', name: 'won_bets', default: 0 })
  wonBets!: number;

  @Column({ type: 'int', name: 'lost_bets', default: 0 })
  lostBets!: number;

  @Column({
    type: 'decimal',
    name: 'win_rate',
    precision: 10,
    scale: 2,
    default: 0,
  })
  winRate!: number;

  @Column({
    type: 'decimal',
    name: 'total_winnings',
    precision: 15,
    scale: 0,
    default: 0,
  })
  totalWinnings!: number;

  @Column({
    type: 'decimal',
    name: 'total_losses',
    precision: 15,
    scale: 0,
    default: 0,
  })
  totalLosses!: number;

  @Column({ type: 'decimal', name: 'roi', precision: 10, scale: 2, default: 0 })
  roi!: number;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'betting_level',
    default: 'BEGINNER',
  })
  bettingLevel?: string; // 마권 구매 레벨 (BEGINNER, INTERMEDIATE, ADVANCED, EXPERT)

  @Column({ type: 'varchar', length: 20, name: 'status', default: 'ACTIVE' })
  status?: string; // 계정 상태 (ACTIVE, SUSPENDED, BANNED)

  @Column({ type: 'text', name: 'profile_bio', nullable: true })
  profileBio?: string; // 프로필 소개

  @Column({ type: 'json', name: 'achievements', nullable: true })
  achievements?: {
    firstBet?: Date; // 첫 마권 구매
    firstWin?: Date; // 첫 당첨
    tenBets?: Date; // 10개 마권 구매
    hundredBets?: Date; // 100개 마권 구매
    perfectBet?: Date; // 완벽한 마권
    streakWins?: number; // 연속 당첨
    totalWinnings?: number; // 총 상금
    bettingStreak?: number; // 연속 베팅
    specialEvents?: string[]; // 특별 이벤트 참여
  };

  // 계정 정보
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // 관계 설정
  @OneToMany(() => Bet, bet => bet.user)
  bets?: Bet[];

  @OneToMany(() => UserPoints, pointTransaction => pointTransaction.user)
  pointTransactions?: UserPoints[];

  @OneToOne(() => UserPointBalance, pointBalance => pointBalance.user)
  pointBalance?: UserPointBalance;

  @OneToMany(() => UserSocialAuth, socialAuth => socialAuth.user)
  socialAuths?: UserSocialAuth[];

  @OneToMany(() => RefreshToken, refreshToken => refreshToken.user)
  refreshTokens?: RefreshToken[];
}
