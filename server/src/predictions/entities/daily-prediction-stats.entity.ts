import {
  Entity,
  Column,
  PrimaryColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';

/**
 * 일일 AI 예측 통계
 */
@Entity('daily_prediction_stats')
export class DailyPredictionStats {
  @PrimaryColumn({ type: 'date' })
  date: Date;

  // 예측 통계
  @Column({ name: 'total_predictions', type: 'int', default: 0 })
  totalPredictions: number;

  @Column({ name: 'first_correct', type: 'int', default: 0 })
  firstCorrect: number;

  @Column({ name: 'top3_correct', type: 'int', default: 0 })
  top3Correct: number;

  @Column({ name: 'exact_order_correct', type: 'int', default: 0 })
  exactOrderCorrect: number;

  // 정확도 (%)
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  accuracy: number;

  @Column({
    name: 'top3_accuracy',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  top3Accuracy: number;

  @Column({
    name: 'exact_order_accuracy',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  exactOrderAccuracy: number;

  @Column({
    name: 'avg_confidence',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  avgConfidence: number;

  @Column({
    name: 'avg_accuracy_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  avgAccuracyScore: number;

  // 비용
  @Column({
    name: 'total_cost',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  totalCost: number;

  @Column({ name: 'total_updates', type: 'int', default: 0 })
  totalUpdates: number;

  @Column({
    name: 'update_cost',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  updateCost: number;

  // ROI 시뮬레이션
  @Column({
    name: 'simulated_stake',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  simulatedStake: number;

  @Column({
    name: 'simulated_return',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  simulatedReturn: number;

  @Column({
    name: 'simulated_roi',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  simulatedRoi: number;

  // 타임스탬프
  @CreateDateColumn({ name: 'calculated_at' })
  calculatedAt: Date;

  // 인덱스
  @Index()
  date_index: Date;

  @Index()
  accuracy_index: number;
}
