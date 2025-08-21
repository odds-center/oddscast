import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum PointTransactionType {
  SIGNUP_BONUS = 'SIGNUP_BONUS', // 가입 보너스
  DAILY_LOGIN = 'DAILY_LOGIN', // 일일 로그인
  BET_PLACED = 'BET_PLACED', // 베팅 배치
  BET_WON = 'BET_WON', // 베팅 당첨
  BET_LOST = 'BET_LOST', // 베팅 미당첨
  REFERRAL_BONUS = 'REFERRAL_BONUS', // 추천 보너스
  EVENT_BONUS = 'EVENT_BONUS', // 이벤트 보너스
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT', // 관리자 조정
  WITHDRAWAL = 'WITHDRAWAL', // 포인트 출금
  EXPIRY = 'EXPIRY', // 포인트 만료
}

export enum PointStatus {
  ACTIVE = 'ACTIVE', // 활성
  PENDING = 'PENDING', // 대기중
  EXPIRED = 'EXPIRED', // 만료
  CANCELLED = 'CANCELLED', // 취소
}

@Entity('user_points')
export class UserPoints {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // 사용자 정보 (외래키)
  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  @Index()
  userId!: string;

  // 포인트 거래 정보
  @Column({ type: 'enum', enum: PointTransactionType })
  @Index()
  transactionType!: PointTransactionType; // 거래 타입

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'amount' })
  amount!: number; // 포인트 금액

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'balance_after' })
  balanceAfter!: number; // 거래 후 잔액

  @Column({ type: 'enum', enum: PointStatus, default: PointStatus.ACTIVE })
  @Index()
  status!: PointStatus; // 포인트 상태

  // 거래 상세 정보
  @Column({ type: 'varchar', length: 255, name: 'description' })
  description!: string; // 거래 설명

  @Column({ type: 'text', name: 'details', nullable: true })
  details?: string; // 상세 정보

  @Column({ type: 'json', name: 'metadata', nullable: true })
  metadata?: {
    betId?: string; // 관련 베팅 ID
    raceId?: string; // 관련 경주 ID
    odds?: number; // 배당률
    winAmount?: number; // 당첨금
    referralUserId?: string; // 추천 사용자 ID
    eventId?: string; // 이벤트 ID
    adminNote?: string; // 관리자 메모
  };

  // 만료 정보
  @Column({ type: 'datetime', name: 'expiry_date', nullable: true })
  expiryDate?: Date; // 만료일

  @Column({ type: 'boolean', name: 'is_expirable', default: false })
  isExpirable!: boolean; // 만료 가능 여부

  // 거래 시간
  @Column({ type: 'datetime', name: 'transaction_time' })
  @Index()
  transactionTime!: Date; // 거래 시간

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // 관계 설정
  @ManyToOne(() => User, user => user.pointTransactions)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // 가상 컬럼 (계산된 값)
  @Column({ type: 'boolean', name: 'is_bonus', default: false })
  isBonus?: boolean; // 보너스 포인트 여부

  @Column({ type: 'varchar', length: 20, name: 'source', default: 'SYSTEM' })
  source?: string; // 포인트 출처 (SYSTEM, BET, EVENT, ADMIN)
}
