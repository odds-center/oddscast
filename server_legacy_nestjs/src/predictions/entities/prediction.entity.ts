import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  OneToMany,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Race } from '../../races/entities/race.entity';
import { PredictionUpdate } from './prediction-update.entity';
import { PredictionFailure } from './prediction-failure.entity';

/**
 * AI 예측 엔티티 (캐싱 최적화 버전)
 */
@Entity('ai_predictions')
@Index(['raceId', 'predictedAt'])
export class Prediction extends BaseEntity {
  // 경주 정보 (UNIQUE - 한 경주당 하나의 예측만)
  @Column({ name: 'race_id', type: 'varchar', length: 36, unique: true })
  @Index()
  raceId: string;

  @ManyToOne(() => Race, { nullable: true })
  @JoinColumn({ name: 'race_id' })
  race: Race;

  // 관계: 업데이트 이력
  @OneToMany(() => PredictionUpdate, update => update.prediction)
  updates: PredictionUpdate[];

  // 관계: 실패 분석
  @OneToMany(() => PredictionFailure, failure => failure.prediction)
  failures: PredictionFailure[];

  // 예측 결과
  @Column({ name: 'predicted_first', type: 'int', comment: '1위 예측 마번' })
  predictedFirst: number;

  @Column({ name: 'predicted_second', type: 'int', comment: '2위 예측 마번' })
  predictedSecond: number;

  @Column({ name: 'predicted_third', type: 'int', comment: '3위 예측 마번' })
  predictedThird: number;

  // 분석 내용
  @Column({ type: 'text', comment: 'AI 분석 내용', nullable: true })
  analysis: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    comment: '신뢰도 (0-100)',
  })
  confidence: number;

  @Column({ type: 'json', nullable: true, comment: '주의사항 목록' })
  warnings: string[];

  @Column({ type: 'json', nullable: true, comment: '예측 요인 점수' })
  factors: Record<string, number>;

  // LLM 메타데이터
  @Column({
    name: 'model_version',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  modelVersion: string;

  @Column({ name: 'llm_provider', type: 'varchar', length: 20, nullable: true })
  @Index()
  llmProvider: string;

  @Column({
    name: 'prompt_version',
    type: 'varchar',
    length: 20,
    default: 'v1.0',
  })
  promptVersion: string;

  @Column({ name: 'input_tokens', type: 'int', nullable: true })
  inputTokens: number;

  @Column({ name: 'output_tokens', type: 'int', nullable: true })
  outputTokens: number;

  @Column({ name: 'total_tokens', type: 'int', nullable: true })
  totalTokens: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
    comment: '비용 (원)',
  })
  cost: number;

  @Column({
    name: 'response_time',
    type: 'int',
    nullable: true,
    comment: '응답 시간 (ms)',
  })
  responseTime: number;

  // 타임스탬프
  @CreateDateColumn({ name: 'predicted_at', comment: '최초 예측 시각' })
  predictedAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    comment: '마지막 업데이트 시각',
    nullable: true,
  })
  updatedAt: Date;

  // 실제 결과 (경주 후)
  @Column({ name: 'actual_first', type: 'int', nullable: true })
  actualFirst: number;

  @Column({ name: 'actual_second', type: 'int', nullable: true })
  actualSecond: number;

  @Column({ name: 'actual_third', type: 'int', nullable: true })
  actualThird: number;

  @Column({ name: 'first_correct', type: 'boolean', nullable: true })
  firstCorrect: boolean;

  @Column({ name: 'in_top3', type: 'boolean', nullable: true })
  inTop3: boolean;

  @Column({ name: 'exact_order', type: 'boolean', nullable: true })
  exactOrder: boolean;

  @Column({
    name: 'accuracy_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  accuracyScore: number;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  @Index()
  verifiedAt: Date;

  // 상태
  @Column({ name: 'is_finalized', type: 'boolean', default: false })
  isFinalized: boolean;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  /**
   * 예측 검증 (경주 결과와 비교)
   */
  verifyPrediction(first: number, second: number, third: number): void {
    this.actualFirst = first;
    this.actualSecond = second;
    this.actualThird = third;

    // 1위 정확도
    this.firstCorrect = this.predictedFirst === first;

    // 3위 내 정확도
    const predictedSet = new Set([
      this.predictedFirst,
      this.predictedSecond,
      this.predictedThird,
    ]);
    this.inTop3 = predictedSet.has(first);

    // 순서까지 정확
    this.exactOrder =
      this.predictedFirst === first &&
      this.predictedSecond === second &&
      this.predictedThird === third;

    // 정확도 점수 계산
    let score = 0;
    if (this.predictedFirst === first) score += 50;
    if (this.predictedSecond === second) score += 30;
    if (this.predictedThird === third) score += 20;

    this.accuracyScore = score;
    this.verifiedAt = new Date();
  }

  /**
   * 경주 시작 플래그 설정
   */
  finalize(): void {
    this.isFinalized = true;
  }
}
