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
import { Race } from '../../races/entities/race.entity';

/**
 * AI 예측 엔티티
 */
@Entity('predictions')
@Index(['raceId', 'createdAt'])
export class Prediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 경주 정보
  @Column({ type: 'varchar', length: 36 })
  @Index()
  raceId: string;

  @ManyToOne(() => Race, { nullable: true })
  @JoinColumn({ name: 'raceId' })
  race: Race;

  // 예측 결과
  @Column({ type: 'int', comment: '1위 예측 마번' })
  firstPlace: number;

  @Column({ type: 'int', comment: '2위 예측 마번' })
  secondPlace: number;

  @Column({ type: 'int', comment: '3위 예측 마번' })
  thirdPlace: number;

  // 분석 내용
  @Column({ type: 'text', comment: '예측 분석 내용' })
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

  // LLM 메타데이터
  @Column({ type: 'varchar', length: 50, comment: 'LLM 모델명' })
  llmModel: string;

  @Column({ type: 'int', comment: '입력 토큰 수' })
  inputTokens: number;

  @Column({ type: 'int', comment: '출력 토큰 수' })
  outputTokens: number;

  @Column({ type: 'int', comment: '총 토큰 수' })
  totalTokens: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '비용 (KRW)' })
  llmCost: number;

  @Column({ type: 'int', comment: '응답 시간 (ms)' })
  responseTime: number;

  // 정확도 검증 (경주 종료 후)
  @Column({ type: 'boolean', nullable: true, comment: '예측 정확 여부' })
  isAccurate: boolean;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: '정확도 점수',
  })
  accuracyScore: number;

  // 실제 결과 (검증용)
  @Column({ type: 'int', nullable: true, comment: '실제 1위' })
  actualFirstPlace: number;

  @Column({ type: 'int', nullable: true, comment: '실제 2위' })
  actualSecondPlace: number;

  @Column({ type: 'int', nullable: true, comment: '실제 3위' })
  actualThirdPlace: number;

  // 타임스탬프
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * 정확도 계산
   */
  calculateAccuracy(first: number, second: number, third: number): number {
    let score = 0;

    // 1위 맞추면 50점
    if (this.firstPlace === first) {
      score += 50;
    }

    // 2위 맞추면 30점
    if (this.secondPlace === second) {
      score += 30;
    }

    // 3위 맞추면 20점
    if (this.thirdPlace === third) {
      score += 20;
    }

    // 보너스: 순서는 틀려도 3개 중 2개 이상 맞추면 +10점
    const predictedSet = new Set([
      this.firstPlace,
      this.secondPlace,
      this.thirdPlace,
    ]);
    const actualSet = new Set([first, second, third]);
    const intersection = [...predictedSet].filter(x => actualSet.has(x));

    if (intersection.length >= 2 && score < 100) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * 예측 검증 (경주 결과와 비교)
   */
  verifyPrediction(first: number, second: number, third: number): void {
    this.actualFirstPlace = first;
    this.actualSecondPlace = second;
    this.actualThirdPlace = third;

    this.accuracyScore = this.calculateAccuracy(first, second, third);
    this.isAccurate = this.accuracyScore >= 50; // 50점 이상이면 정확한 것으로 간주
  }
}
