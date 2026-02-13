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
 * 예측 실패 유형
 */
export enum FailureType {
  OVERCONFIDENCE = 'overconfidence', // 과신 (높은 신뢰도, 틀림)
  UPSET = 'upset', // 이변 (다크호스 우승)
  WEATHER = 'weather', // 날씨 영향
  TRACK_CONDITION = 'track_condition', // 주로 상태 변수
  INJURY = 'injury', // 부상/컨디션 저하
  OTHER = 'other', // 기타
}

/**
 * AI 예측 실패 분석
 */
@Entity('prediction_failures')
@Index(['failureType', 'analyzedAt'])
export class PredictionFailure extends BaseEntity {
  @Column({ name: 'prediction_id', type: 'varchar', length: 36 })
  @Index()
  predictionId: string;

  @ManyToOne(() => Prediction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prediction_id' })
  prediction: Prediction;

  @Column({ name: 'race_id', type: 'varchar', length: 36 })
  @Index()
  raceId: string;

  // 실패 정보
  @Column({ name: 'predicted_first', type: 'int' })
  predictedFirst: number;

  @Column({ name: 'actual_first', type: 'int' })
  actualFirst: number;

  @Column({
    name: 'prediction_confidence',
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  predictionConfidence: number;

  // 실패 분류
  @Column({
    name: 'failure_type',
    type: 'enum',
    enum: FailureType,
  })
  @Index()
  failureType: FailureType;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string;

  // 컨텍스트 정보
  @Column({ name: 'race_grade', type: 'int', nullable: true })
  raceGrade: number;

  @Column({ name: 'race_distance', type: 'int', nullable: true })
  raceDistance: number;

  @Column({
    name: 'track_condition',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  trackCondition: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  weather: string;

  @Column({ name: 'actual_winner_popularity', type: 'int', nullable: true })
  actualWinnerPopularity: number;

  // 타임스탬프
  @CreateDateColumn({ name: 'analyzed_at' })
  analyzedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
