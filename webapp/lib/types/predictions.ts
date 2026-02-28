/**
 * AI prediction horseScores item (for race detail display)
 */
export interface PredictionHorseScore {
  hrNo?: string;
  hrName?: string;
  horseName?: string;
  score?: number;
  reason?: string;
  chulNo?: string;
  /** Strengths summary */
  strengths?: string[];
  /** Weaknesses summary */
  weaknesses?: string[];
  /** AI confidence level: high/medium/low */
  confidence?: 'high' | 'medium' | 'low';
}

/** AI prediction by bet type — separate recommendation for each bet type */
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

/** 2-horse/3-horse bet types — 3 combination examples (quinella, exacta, quinella place, trifecta, triple) */
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
  /** Quinella: 3 combinations (different from each other) */
  QUINELLA?: BetTypePredictionPair | BetTypePredictionPairMulti;
  /** Exacta: 3 combinations */
  EXACTA?: BetTypePredictionExacta | BetTypePredictionExactaMulti;
  /** Quinella Place: 3 combinations */
  QUINELLA_PLACE?: BetTypePredictionPair | BetTypePredictionPairMulti;
  /** Trifecta: 3 combinations */
  TRIFECTA?: BetTypePredictionTriple | BetTypePredictionTripleMulti;
  /** Triple: 3 combinations */
  TRIPLE?: BetTypePredictionTripleExact | BetTypePredictionTripleExactMulti;
}

/**
 * AI prediction scores object (for race detail display)
 */
export interface PredictionScoresDto {
  horseScores?: PredictionHorseScore[];
  betTypePredictions?: BetTypePredictions;
}

/**
 * AI prediction detail (for race detail display)
 */
export interface PredictionDetailDto {
  scores?: PredictionScoresDto;
  analysis?: string;
  preview?: string;
  /** Gemini-generated post-race summary (2-3 sentences) when results are in */
  postRaceSummary?: string | null;
}

/**
 * AI prediction result DTO
 * (some APIs return extended form including scores)
 */
export interface PredictionResultDto {
  id: string;
  raceId: string;
  predictedFirst: number;
  /** scores for race detail display (optional, provided in prediction ticket usage response, etc.) */
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

  // Prediction ticket usage information (optional)
  ticketUsed?: boolean;
  ticketId?: string;
}

/**
 * Prediction status DTO
 */
export interface PredictionStatusDto {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  raceId: string;
  estimatedTime?: number; // Estimated time required (seconds)
}

/**
 * Prediction preview (for blur processing, GET /predictions/race/:raceId/preview response)
 */
export interface PredictionPreview {
  raceId?: string;
  hasPrediction?: boolean;
  confidence?: number;
  requiresTicket?: boolean;
  message?: string;
  status?: 'pending' | 'completed' | 'failed';
  /** Summary text of DB-stored prediction (when previewApproved) */
  preview?: string;
  analysis?: string;
  scores?: PredictionScoresDto;
}

/**
 * Create prediction request DTO
 */
export interface CreatePredictionDto {
  raceId: string;
  llmProvider?: 'openai' | 'claude';
  temperature?: number;
  maxTokens?: number;
}

/**
 * Daily prediction statistics
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
 * Model performance
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
 * Analytics dashboard
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
