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
import { User } from '../../users/entities/user.entity';

export enum PaymentStatus {
  PENDING = 'PENDING', // 결제 대기
  SUCCESS = 'SUCCESS', // 결제 성공
  FAILED = 'FAILED', // 결제 실패
  CANCELLED = 'CANCELLED', // 결제 취소
  REFUNDED = 'REFUNDED', // 환불 완료
}

export enum PaymentMethod {
  CARD = 'CARD', // 신용카드
  VIRTUAL_ACCOUNT = 'VIRTUAL_ACCOUNT', // 가상계좌
  TRANSFER = 'TRANSFER', // 계좌이체
  MOBILE = 'MOBILE', // 휴대폰
  KAKAOPAY = 'KAKAOPAY', // 카카오페이
  NAVERPAY = 'NAVERPAY', // 네이버페이
  TOSSPAY = 'TOSSPAY', // 토스페이
}

/**
 * 결제 엔티티
 */
@Entity('payments')
@Index(['userId', 'createdAt'])
@Index(['pgTransactionId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 사용자
  @Column({ type: 'varchar', length: 36 })
  @Index()
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  // 결제 정보
  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  orderId: string; // 주문 ID

  @Column({ type: 'varchar', length: 200 })
  orderName: string; // 주문명

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // 결제 금액

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CARD,
  })
  paymentMethod: PaymentMethod;

  // PG사 정보 (Toss Payments)
  @Column({ type: 'varchar', length: 200, nullable: true })
  paymentKey: string | null; // Toss 결제 키

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  @Index()
  pgTransactionId: string | null; // PG사 거래 ID

  @Column({ type: 'varchar', length: 100, nullable: true })
  receiptUrl: string | null; // 영수증 URL

  // 상태
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Index()
  status: PaymentStatus;

  // 취소/환불 정보
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cancelledAmount: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancelReason: string | null;

  @Column({ type: 'datetime', nullable: true })
  cancelledAt: Date | null;

  // 메타데이터
  @Column({ type: 'json', nullable: true })
  metadata: any;

  // 타임스탬프
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * 결제 승인
   */
  approve(paymentKey: string, pgTransactionId: string): void {
    this.status = PaymentStatus.SUCCESS;
    this.paymentKey = paymentKey;
    this.pgTransactionId = pgTransactionId;
  }

  /**
   * 결제 실패
   */
  fail(reason: string): void {
    this.status = PaymentStatus.FAILED;
    this.cancelReason = reason;
  }

  /**
   * 결제 취소
   */
  cancel(reason: string, amount?: number): void {
    this.status = PaymentStatus.CANCELLED;
    this.cancelReason = reason;
    this.cancelledAmount = amount || this.amount;
    this.cancelledAt = new Date();
  }

  /**
   * 환불 처리
   */
  refund(reason: string, amount?: number): void {
    this.status = PaymentStatus.REFUNDED;
    this.cancelReason = reason;
    this.cancelledAmount = amount || this.amount;
    this.cancelledAt = new Date();
  }
}
