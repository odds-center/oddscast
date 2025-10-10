/**
 * 예측 결과 DTO
 */
export class PredictionResultDto {
  id: string;
  raceId: string;

  // 예측 결과
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;

  // 분석
  analysis: string;
  confidence: number;
  warnings: string[];

  // LLM 메타데이터
  llmModel: string;
  llmCost: number;
  responseTime: number;

  // 정확도 (검증 후)
  isAccurate?: boolean;
  accuracyScore?: number;

  createdAt: Date;
}
