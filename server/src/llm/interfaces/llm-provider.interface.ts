/**
 * LLM Provider Interface
 *
 * 모든 LLM 제공자(OpenAI, Claude 등)가 구현해야 하는 인터페이스
 */

export interface LlmProvider {
  /**
   * 모델 이름
   */
  readonly modelName: string;

  /**
   * 예측 생성
   * @param prompt 프롬프트 텍스트
   * @param options 옵션
   */
  predict(prompt: string, options?: LlmPredictOptions): Promise<LlmResponse>;

  /**
   * 비용 계산
   * @param inputTokens 입력 토큰 수
   * @param outputTokens 출력 토큰 수
   */
  calculateCost(inputTokens: number, outputTokens: number): number;
}

/**
 * LLM 예측 옵션
 */
export interface LlmPredictOptions {
  /**
   * 응답 창의성 (0.0 ~ 1.0)
   * 낮을수록 일관성, 높을수록 창의적
   */
  temperature?: number;

  /**
   * 최대 출력 토큰 수
   */
  maxTokens?: number;

  /**
   * Top-p 샘플링 (0.0 ~ 1.0)
   */
  topP?: number;
}

/**
 * LLM 응답
 */
export interface LlmResponse {
  /**
   * 생성된 텍스트
   */
  content: string;

  /**
   * 사용된 모델
   */
  model: string;

  /**
   * 입력 토큰 수
   */
  inputTokens: number;

  /**
   * 출력 토큰 수
   */
  outputTokens: number;

  /**
   * 총 토큰 수
   */
  totalTokens: number;

  /**
   * 비용 (KRW)
   */
  cost: number;

  /**
   * 응답 시간 (ms)
   */
  responseTime: number;
}
