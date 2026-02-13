/**
 * AI 예측 horseScores 항목 (경주 상세 표시용)
 */
export interface PredictionHorseScore {
  hrNo?: string;
  hrName?: string;
  horseName?: string;
  score?: number;
  reason?: string;
  chulNo?: string;
}

/**
 * AI 예측 scores 객체 (경주 상세 표시용)
 */
export interface PredictionScoresDto {
  horseScores?: PredictionHorseScore[];
}

/**
 * AI 예측 상세 (경주 상세 표시용)
 */
export interface PredictionDetailDto {
  scores?: PredictionScoresDto;
  analysis?: string;
  preview?: string;
}

/**
 * AI 예측 결과 DTO
 * (일부 API는 scores를 포함한 확장 형태로 반환)
 */
export interface PredictionResultDto {
  id: string;
  raceId: string;
  predictedFirst: number;
  /** 경주 상세 표시용 scores (선택, 예측권 사용 응답 등에서 제공) */
  scores?: PredictionScoresDto;
  predictedSecond: number;
  predictedThird: number;
  analysis: string;
  confidence: number;
  warnings?: string[];
  factors?: Record<string, number>;
  modelVersion: string;
  llmProvider: string;
  cost: number;
  responseTime: number;
  firstCorrect?: boolean;
  inTop3?: boolean;
  exactOrder?: boolean;
  accuracyScore?: number;
  predictedAt: Date;
  updatedAt?: Date;
  verifiedAt?: Date;

  // 예측권 사용 정보 (선택적)
  ticketUsed?: boolean;
  ticketId?: string;
}

/**
 * 예측 상태 DTO
 */
export interface PredictionStatusDto {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  raceId: string;
  estimatedTime?: number; // 예상 소요 시간 (초)
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
  status?: 'pending' | 'completed' | 'failed';
}

/**
 * 예측 생성 요청 DTO
 */
export interface CreatePredictionDto {
  raceId: string;
  llmProvider?: 'openai' | 'claude';
  temperature?: number;
  maxTokens?: number;
}

/**
 * 일일 예측 통계
 */
export interface DailyPredictionStats {
  date: string;
  totalPredictions: number;
  firstCorrect: number;
  top3Correct: number;
  exactOrderCorrect: number;
  accuracy: number;
  top3Accuracy: number;
  exactOrderAccuracy: number;
  avgConfidence: number;
  avgAccuracyScore: number;
  totalCost: number;
  totalUpdates: number;
  updateCost: number;
  simulatedStake?: number;
  simulatedReturn?: number;
  simulatedRoi?: number;
}

/**
 * 모델 성과
 */
export interface ModelPerformance {
  modelVersion: string;
  llmProvider: string;
  totalPredictions: number;
  firstCorrect: number;
  top3Correct: number;
  accuracy: number;
  top3Accuracy: number;
  avgConfidence: number;
  totalCost: number;
  avgCostPerPrediction: number;
  simulatedRoi?: number;
  isActive: boolean;
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
  recentFailures: Record<string, unknown>[];
}
