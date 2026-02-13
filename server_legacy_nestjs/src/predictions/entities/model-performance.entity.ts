import {
  Entity,
  Column,
  PrimaryColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 모델 버전별 성과
 */
@Entity('model_performance')
export class ModelPerformance {
  @PrimaryColumn({ name: 'model_version', type: 'varchar', length: 20 })
  modelVersion: string;

  @Column({ name: 'llm_provider', type: 'varchar', length: 20, nullable: true })
  @Index()
  llmProvider: string;

  // 예측 통계
  @Column({ name: 'total_predictions', type: 'int', default: 0 })
  totalPredictions: number;

  @Column({ name: 'first_correct', type: 'int', default: 0 })
  firstCorrect: number;

  @Column({ name: 'top3_correct', type: 'int', default: 0 })
  top3Correct: number;

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
    name: 'avg_confidence',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  avgConfidence: number;

  // 비용
  @Column({
    name: 'total_cost',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalCost: number;

  @Column({
    name: 'avg_cost_per_prediction',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  avgCostPerPrediction: number;

  // ROI
  @Column({
    name: 'simulated_roi',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  simulatedRoi: number;

  // 상태
  @Column({ name: 'is_active', type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  // 타임스탬프
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
