/**
 * 예측 응답 DTO
 */
export class PredictionResponseDto {
  /**
   * 1위 예측 마번
   */
  firstPlace: number;

  /**
   * 2위 예측 마번
   */
  secondPlace: number;

  /**
   * 3위 예측 마번
   */
  thirdPlace: number;

  /**
   * 예측 분석 내용
   */
  analysis: string;

  /**
   * 신뢰도 (0 ~ 100)
   */
  confidence: number;

  /**
   * 주의사항
   */
  warnings?: string[];

  /**
   * LLM 메타데이터
   */
  metadata: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    responseTime: number;
  };
}
