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
import { Prediction } from '../../predictions/entities/prediction.entity';

export enum TicketStatus {
  AVAILABLE = 'AVAILABLE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
}

/**
 * 예측권 엔티티
 */
@Entity('prediction_tickets')
@Index(['userId', 'status'])
@Index(['expiresAt', 'status'])
export class PredictionTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 사용자
  @Column({ type: 'varchar', length: 36 })
  @Index()
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  // 구독 ID (구독으로 발급된 경우)
  @Column({ type: 'varchar', length: 36, nullable: true })
  subscriptionId: string | null;

  // 발급 출처
  @Column({
    type: 'enum',
    enum: ['subscription', 'single_purchase', 'bonus'],
    default: 'subscription',
    comment: '발급 출처',
  })
  source: 'subscription' | 'single_purchase' | 'bonus';

  // 상태
  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.AVAILABLE,
  })
  status: TicketStatus;

  // 사용 정보
  @Column({ type: 'datetime', nullable: true })
  usedAt: Date | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  raceId: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  predictionId: string | null;

  @ManyToOne(() => Prediction, { nullable: true })
  @JoinColumn({ name: 'predictionId' })
  prediction: Prediction;

  // 예측 버전 추적 (업데이트 감지용)
  @Column({ type: 'datetime', nullable: true, comment: '예측을 본 시점' })
  viewedAt: Date | null;

  // 유효 기간
  @CreateDateColumn()
  issuedAt: Date;

  @Column({ type: 'datetime' })
  @Index()
  expiresAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * 사용 가능 여부 확인
   */
  isAvailable(): boolean {
    if (this.status !== TicketStatus.AVAILABLE) {
      return false;
    }

    if (new Date() > this.expiresAt) {
      return false;
    }

    return true;
  }

  /**
   * 예측권 사용
   */
  use(raceId: string, predictionId: string): void {
    if (!this.isAvailable()) {
      throw new Error('Ticket is not available');
    }

    this.status = TicketStatus.USED;
    this.usedAt = new Date();
    this.raceId = raceId;
    this.predictionId = predictionId;
    this.viewedAt = new Date(); // 예측을 본 시점 기록
  }

  /**
   * 예측권 만료
   */
  expire(): void {
    if (this.status === TicketStatus.AVAILABLE) {
      this.status = TicketStatus.EXPIRED;
    }
  }
}
