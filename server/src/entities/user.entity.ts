import {
  Column,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Bet } from './bet.entity';
import { Race } from './race.entity';
import { UserPointBalance } from './user-point-balance.entity';
import { UserPoints } from './user-points.entity';

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  email!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name?: string;

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

  @Column({
    type: 'varchar',
    length: 500,
    name: 'refresh_token',
    nullable: true,
  })
  refreshToken?: string;

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

  // 마권 통계
  @Column({ type: 'int', name: 'total_bets', default: 0 })
  totalBets!: number; // 총 마권 구매 수

  @Column({ type: 'int', name: 'won_bets', default: 0 })
  wonBets!: number; // 당첨 마권 수

  @Column({ type: 'int', name: 'lost_bets', default: 0 })
  lostBets!: number; // 미당첨 마권 수

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'win_rate',
    default: 0,
  })
  winRate!: number; // 단승률

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'total_winnings',
    default: 0,
  })
  totalWinnings!: number; // 총 당첨금

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 0,
    name: 'total_losses',
    default: 0,
  })
  totalLosses!: number; // 총 손실

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'roi',
    default: 0,
  })
  roi!: number; // 투자수익률

  // 계정 정보
  @Column({ type: 'datetime', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'datetime', name: 'updated_at' })
  updatedAt!: Date;

  // 관계 설정
  @OneToMany(() => Race, race => race.user)
  createdRaces?: Race[];

  @OneToMany(() => Bet, bet => bet.user)
  bets?: Bet[];

  @OneToMany(() => UserPoints, pointTransaction => pointTransaction.user)
  pointTransactions?: UserPoints[];

  @OneToOne(() => UserPointBalance, pointBalance => pointBalance.user)
  pointBalance?: UserPointBalance;

  // 가상 컬럼 (계산된 값)
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
    totalEarnings?: number; // 총 수익
  };
}
