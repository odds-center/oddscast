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
  /** 강점 요약 */
  strengths?: string[];
  /** 약점 요약 */
  weaknesses?: string[];
  /** AI 확신도: high/medium/low */
  confidence?: 'high' | 'medium' | 'low';
}

/** 승식별 AI 예측 — 각 승식마다 별도 추천 */
export interface BetTypePredictionSingle {
  hrNo: string;
  reason?: string;
}
export interface BetTypePredictionPair {
  hrNos: [string, string];
  reason?: string;
}
export interface BetTypePredictionExacta {
  first: string;
  second: string;
  reason?: string;
}
export interface BetTypePredictionTriple {
  hrNos: [string, string, string];
  reason?: string;
}
export interface BetTypePredictionTripleExact {
  first: string;
  second: string;
  third: string;
  reason?: string;
}

/** 2마리/3마리 승식 — 3개 조합 예시 (연승·쌍승·복연승·삼복승·삼쌍승) */
export interface BetTypePredictionPairMulti {
  combinations: BetTypePredictionPair[];
  reason?: string;
}
export interface BetTypePredictionExactaMulti {
  combinations: BetTypePredictionExacta[];
  reason?: string;
}
export interface BetTypePredictionTripleMulti {
  combinations: BetTypePredictionTriple[];
  reason?: string;
}
export interface BetTypePredictionTripleExactMulti {
  combinations: BetTypePredictionTripleExact[];
  reason?: string;
}

export interface BetTypePredictions {
  SINGLE?: BetTypePredictionSingle;
  PLACE?: BetTypePredictionSingle;
  /** 연승식: 3개 조합 (서로 다름) */
  QUINELLA?: BetTypePredictionPair | BetTypePredictionPairMulti;
  /** 쌍승식: 3개 조합 */
  EXACTA?: BetTypePredictionExacta | BetTypePredictionExactaMulti;
  /** 복연승식: 3개 조합 */
  QUINELLA_PLACE?: BetTypePredictionPair | BetTypePredictionPairMulti;
  /** 삼복승식: 3개 조합 */
  TRIFECTA?: BetTypePredictionTriple | BetTypePredictionTripleMulti;
  /** 삼쌍승식: 3개 조합 */
  TRIPLE?: BetTypePredictionTripleExact | BetTypePredictionTripleExactMulti;
}

/**
 * AI 예측 scores 객체 (경주 상세 표시용)
 */
export interface PredictionScoresDto {
  horseScores?: PredictionHorseScore[];
  betTypePredictions?: BetTypePredictions;
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
 * 예측 미리보기 (블러 처리용, GET /predictions/race/:raceId/preview 응답)
 */
export interface PredictionPreview {
  raceId?: string;
  hasPrediction?: boolean;
  confidence?: number;
  requiresTicket?: boolean;
  message?: string;
  status?: 'pending' | 'completed' | 'failed';
  /** DB 저장 예측의 요약 텍스트 (previewApproved 시) */
  preview?: string;
  analysis?: string;
  scores?: PredictionScoresDto;
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
