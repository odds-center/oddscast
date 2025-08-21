import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_point_balances')
export class UserPointBalance {
  @PrimaryColumn({ type: 'varchar', length: 36, name: 'user_id' })
  userId!: string;

  // 현재 포인트 잔액
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'current_points',
    default: 0,
  })
  currentPoints!: number; // 현재 포인트

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'total_points_earned',
    default: 0,
  })
  totalPointsEarned!: number; // 총 획득 포인트

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'total_points_spent',
    default: 0,
  })
  totalPointsSpent!: number; // 총 사용 포인트

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'bonus_points',
    default: 0,
  })
  bonusPoints!: number; // 보너스 포인트

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'regular_points',
    default: 0,
  })
  regularPoints!: number; // 일반 포인트

  // 포인트 통계
  @Column({ type: 'int', name: 'total_transactions', default: 0 })
  totalTransactions!: number; // 총 거래 수

  @Column({ type: 'int', name: 'bonus_transactions', default: 0 })
  bonusTransactions!: number; // 보너스 거래 수

  @Column({ type: 'int', name: 'regular_transactions', default: 0 })
  regularTransactions!: number; // 일반 거래 수

  // 마지막 거래 정보
  @Column({ type: 'datetime', name: 'last_transaction_time', nullable: true })
  lastTransactionTime?: Date; // 마지막 거래 시간

  @Column({
    type: 'varchar',
    length: 100,
    name: 'last_transaction_type',
    nullable: true,
  })
  lastTransactionType?: string; // 마지막 거래 타입

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'last_transaction_amount',
    nullable: true,
  })
  lastTransactionAmount?: number; // 마지막 거래 금액

  // 포인트 만료 정보
  @Column({ type: 'datetime', name: 'next_expiry_date', nullable: true })
  nextExpiryDate?: Date; // 다음 만료일

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'expiring_points',
    default: 0,
  })
  expiringPoints!: number; // 만료 예정 포인트

  // 메타데이터
  @Column({
    type: 'varchar',
    length: 20,
    name: 'api_version',
    default: '1.0.0',
  })
  apiVersion!: string; // API 버전

  @Column({
    type: 'varchar',
    length: 20,
    name: 'data_source',
    default: 'INTERNAL',
  })
  dataSource!: string; // 데이터 출처

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // 관계 설정
  @OneToOne(() => User, user => user.pointBalance)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // 가상 컬럼 (계산된 값)
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'available_points',
    nullable: true,
  })
  availablePoints?: number; // 사용 가능한 포인트

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'locked_points',
    default: 0,
  })
  lockedPoints?: number; // 잠긴 포인트 (베팅 중인 포인트)

  @Column({
    type: 'varchar',
    length: 20,
    name: 'point_status',
    default: 'ACTIVE',
  })
  pointStatus?: string; // 포인트 상태 (ACTIVE, SUSPENDED, LIMITED)

  @Column({ type: 'text', name: 'status_reason', nullable: true })
  statusReason?: string; // 상태 변경 사유
}
