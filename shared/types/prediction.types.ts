/**
 * AI 예측 관련 공통 타입
 * 서버(NestJS)와 모바일(React Native) 모두에서 사용
 */

/**
 * AI 예측 결과
 */
export interface PredictionResult {
  id: string;
  raceId: string;

  // 예측 결과
  predictedFirst: number;
  predictedSecond: number;
  predictedThird: number;

  // 신뢰도 및 분석
  confidence: number; // 0-100
  analysis: string;
  warnings?: string[];
  factors?: Record<string, number>;

  // 메타데이터
  modelVersion: string;
  llmProvider: 'openai'; // Claude 제거
  promptVersion?: string;

  // 비용 및 성능
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cost: number; // KRW
  responseTime: number; // ms

  // 검증 결과 (경주 종료 후)
  actualFirst?: number;
  actualSecond?: number;
  actualThird?: number;
  firstCorrect?: boolean;
  inTop3?: boolean;
  exactOrder?: boolean;
  accuracyScore?: number; // 0-100

  // 타임스탬프
  predictedAt: Date;
  updatedAt?: Date;
  verifiedAt?: Date;

  // 상태
  isFinalized?: boolean;
}

/**
 * 예측 상태
 */
export type PredictionStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * 예측 상태 응답
 */
export interface PredictionStatusResponse {
  status: PredictionStatus;
  message: string;
  raceId: string;
  estimatedTime?: number; // 초
}

/**
 * 예측 미리보기 (블러 처리용)
 */
export interface PredictionPreview {
  raceId: string;
  hasPrediction: boolean;
  confidence?: number;
  requiresTicket: boolean;
  message: string;
  status?: PredictionStatus;
}

/**
 * 예측 생성 요청
 */
export interface CreatePredictionRequest {
  raceId: string;
  llmProvider?: 'openai'; // Claude 제거
  temperature?: number;
  maxTokens?: number;
}

/**
 * 예측 업데이트 이력
 */
export interface PredictionUpdate {
  id: string;
  predictionId: string;

  // 변경 내용
  oldFirst?: number;
  newFirst?: number;
  oldSecond?: number;
  newSecond?: number;
  oldThird?: number;
  newThird?: number;
  oldConfidence?: number;
  newConfidence?: number;

  // 변경 이유
  updateReason: 'scheduled' | 'odds_change' | 'weather_change' | 'horse_withdrawn';
  reasonDetails?: Record<string, any>;

  // 비용
  cost: number;

  // 타임스탬프
  updatedAt: Date;
}

/**
 * 일일 예측 통계
 */
export interface DailyPredictionStats {
  date: string; // YYYY-MM-DD

  // 예측 통계
  totalPredictions: number;
  firstCorrect: number;
  top3Correct: number;
  exactOrderCorrect: number;

  // 정확도
  accuracy: number; // %
  top3Accuracy: number; // %
  exactOrderAccuracy: number; // %
  avgConfidence: number;
  avgAccuracyScore: number;

  // 비용
  totalCost: number;
  totalUpdates: number;
  updateCost: number;

  // ROI 시뮬레이션
  simulatedStake?: number;
  simulatedReturn?: number;
  simulatedRoi?: number; // %

  // 타임스탬프
  calculatedAt?: Date;
}

/**
 * 모델 성과
 */
export interface ModelPerformance {
  modelVersion: string;
  llmProvider: 'openai';

  // 예측 통계
  totalPredictions: number;
  firstCorrect: number;
  top3Correct: number;

  // 정확도
  accuracy: number; // %
  top3Accuracy: number; // %
  avgConfidence: number;

  // 비용
  totalCost: number;
  avgCostPerPrediction: number;

  // ROI
  simulatedRoi?: number; // %

  // 상태
  isActive: boolean;

  // 타임스탬프
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 예측 실패 분석
 */
export interface PredictionFailure {
  id: string;
  predictionId: string;
  raceId: string;

  // 실패 정보
  predictedFirst: number;
  actualFirst: number;
  predictionConfidence: number;

  // 실패 분류
  failureType: 'overconfidence' | 'upset' | 'weather' | 'track_condition';
  failureReason?: string;

  // 컨텍스트
  raceGrade?: number;
  raceDistance?: number;
  trackCondition?: string;
  weather?: string;
  actualWinnerPopularity?: number;

  // 타임스탬프
  analyzedAt: Date;
}

/**
 * 분석 대시보드
 */
export interface AnalyticsDashboard {
  overall: {
    totalPredictions: number;
    averageAccuracy: number;
    averageConfidence: number;
    totalCost: number;
  };
  daily: DailyPredictionStats[];
  models: ModelPerformance[];
  recentFailures: PredictionFailure[];
}
