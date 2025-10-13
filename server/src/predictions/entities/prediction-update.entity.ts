import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Prediction } from './prediction.entity';

/**
 * 예측 업데이트 이유
 */
export enum UpdateReason {
  SCHEDULED = 'scheduled', // 정기 업데이트
  ODDS_CHANGE = 'odds_change', // 배당률 변화
  WEATHER_CHANGE = 'weather_change', // 날씨 변화
  HORSE_WITHDRAWN = 'horse_withdrawn', // 말 기권
  TRACK_CONDITION = 'track_condition', // 주로 상태 변화
  MANUAL = 'manual', // 수동 업데이트
}

/**
 * AI 예측 업데이트 이력
 */
@Entity('ai_prediction_updates')
@Index(['predictionId', 'updatedAt'])
export class PredictionUpdate extends BaseEntity {
  @Column({ name: 'prediction_id', type: 'varchar', length: 36 })
  @Index()
  predictionId: string;

  @ManyToOne(() => Prediction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prediction_id' })
  prediction: Prediction;

  // 변경 내용
  @Column({ name: 'old_first', type: 'int', nullable: true })
  oldFirst: number;

  @Column({ name: 'new_first', type: 'int' })
  newFirst: number;

  @Column({ name: 'old_second', type: 'int', nullable: true })
  oldSecond: number;

  @Column({ name: 'new_second', type: 'int' })
  newSecond: number;

  @Column({ name: 'old_third', type: 'int', nullable: true })
  oldThird: number;

  @Column({ name: 'new_third', type: 'int' })
  newThird: number;

  @Column({
    name: 'old_confidence',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  oldConfidence: number;

  @Column({ name: 'new_confidence', type: 'decimal', precision: 5, scale: 2 })
  newConfidence: number;

  // 업데이트 이유
  @Column({
    name: 'update_reason',
    type: 'enum',
    enum: UpdateReason,
    default: UpdateReason.SCHEDULED,
  })
  @Index()
  updateReason: UpdateReason;

  @Column({ name: 'reason_details', type: 'json', nullable: true })
  reasonDetails: Record<string, any>;

  // 비용
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  cost: number;

  // 타임스탬프 (BaseEntity에서 상속받지만 명시적으로 오버라이드)
  @CreateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
