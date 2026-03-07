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
    predictedFirst: number;
    predictedSecond: number;
    predictedThird: number;
    confidence: number;
    analysis: string;
    warnings?: string[];
    factors?: Record<string, number>;
    modelVersion: string;
    llmProvider: 'openai';
    promptVersion?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    cost: number;
    responseTime: number;
    actualFirst?: number;
    actualSecond?: number;
    actualThird?: number;
    firstCorrect?: boolean;
    inTop3?: boolean;
    exactOrder?: boolean;
    accuracyScore?: number;
    predictedAt: Date;
    updatedAt?: Date;
    verifiedAt?: Date;
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
    estimatedTime?: number;
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
    llmProvider?: 'openai';
    temperature?: number;
    maxTokens?: number;
}
/**
 * 예측 업데이트 이력
 */
export interface PredictionUpdate {
    id: string;
    predictionId: string;
    oldFirst?: number;
    newFirst?: number;
    oldSecond?: number;
    newSecond?: number;
    oldThird?: number;
    newThird?: number;
    oldConfidence?: number;
    newConfidence?: number;
    updateReason: 'scheduled' | 'odds_change' | 'weather_change' | 'horse_withdrawn';
    reasonDetails?: Record<string, any>;
    cost: number;
    updatedAt: Date;
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
    calculatedAt?: Date;
}
/**
 * 모델 성과
 */
export interface ModelPerformance {
    modelVersion: string;
    llmProvider: 'openai';
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
    predictedFirst: number;
    actualFirst: number;
    predictionConfidence: number;
    failureType: 'overconfidence' | 'upset' | 'weather' | 'track_condition';
    failureReason?: string;
    raceGrade?: number;
    raceDistance?: number;
    trackCondition?: string;
    weather?: string;
    actualWinnerPopularity?: number;
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
//# sourceMappingURL=prediction.types.d.ts.map