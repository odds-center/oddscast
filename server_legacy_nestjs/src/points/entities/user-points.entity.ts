import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BaseEntity } from '../../shared/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  EARN = 'EARN', // 획득
  SPEND = 'SPEND', // 사용
  BONUS = 'BONUS', // 보너스
  REFUND = 'REFUND', // 환불
  ADJUSTMENT = 'ADJUSTMENT', // 조정
  BET_PLACED = 'BET_PLACED', // 베팅 배치
  BET_WON = 'BET_WON', // 베팅 당첨
  BET_LOST = 'BET_LOST', // 베팅 미당첨
  SIGNUP_BONUS = 'SIGNUP_BONUS', // 가입 보너스
  DAILY_LOGIN = 'DAILY_LOGIN', // 일일 로그인
  REFERRAL_BONUS = 'REFERRAL_BONUS', // 추천 보너스
  EVENT_BONUS = 'EVENT_BONUS', // 이벤트 보너스
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT', // 관리자 조정
  WITHDRAWAL = 'WITHDRAWAL', // 포인트 출금
  EXPIRY = 'EXPIRY', // 포인트 만료
}

export enum TransactionStatus {
  PENDING = 'PENDING', // 대기중
  COMPLETED = 'COMPLETED', // 완료
  FAILED = 'FAILED', // 실패
  CANCELLED = 'CANCELLED', // 취소
  ACTIVE = 'ACTIVE', // 활성
  EXPIRED = 'EXPIRED', // 만료
}

@Entity('user_points')
export class UserPoints extends BaseEntity {
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  // 사용자 정보 (외래키)
  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  @Index()
  userId!: string;

  // 포인트 거래 정보
  @Column({ type: 'enum', enum: TransactionType })
  @Index()
  transactionType!: TransactionType; // 거래 타입

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'amount' })
  amount!: number; // 포인트 금액

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'balance_after' })
  balanceAfter!: number; // 거래 후 잔액

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  @Index()
  status!: TransactionStatus; // 포인트 상태

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
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
