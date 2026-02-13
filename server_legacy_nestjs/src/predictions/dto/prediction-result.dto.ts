/**
 * 예측 결과 DTO (AI 캐싱 최적화 버전)
 */
export class PredictionResultDto {
  id: string;
  raceId: string;

  // 예측 결과
  predictedFirst: number;
  predictedSecond: number;
  predictedThird: number;

  // 분석
  analysis: string;
  confidence: number;
  warnings: string[];
  factors?: Record<string, number>;

  // LLM 메타데이터
  modelVersion?: string;
  llmProvider?: string;
  cost?: number;
  responseTime?: number;

  // 정확도 (검증 후)
  firstCorrect?: boolean;
  inTop3?: boolean;
  exactOrder?: boolean;
  accuracyScore?: number;

  // 타임스탬프
  predictedAt: Date;
  updatedAt?: Date;
  verifiedAt?: Date;
}
