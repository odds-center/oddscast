/**
 * predictions.service 내부 사용 타입
 */

/** Python/Gemini용 경주 데이터 (Prisma Race + entries 기반) */
export interface RaceForPython {
  meet?: string;
  meetName?: string | null | undefined;
  rcDate?: string;
  rcNo?: string;
  rcDist?: string | null;
  rank?: string | null;
  rcCondition?: string | null;
  rcPrize?: number | null;
  weather?: string | null;
  track?: string | null;
  entries?: RaceEntryForAnalysis[];
  [key: string]: unknown;
}

/** 출전마 (훈련 내역 포함) — Prisma RaceEntry 호환 (null → undefined 변환) */
export interface RaceEntryForAnalysis {
  hrNo: string;
  hrName?: string | null;
  jkName?: string;
  trName?: string | null;
  wgBudam?: number;
  rating?: number;
  chulNo?: string;
  rcCntT?: number;
  ord1CntT?: number;
  recentRanks?: unknown;
  horseWeight?: string;
  equipment?: string;
  bleedingInfo?: unknown;
  isScratched?: boolean;
  trainings?: Array<{ trDate?: string; intensity?: string; trTime?: string; trContent?: string }>;
  trainingData?: unknown;
}

/** Python 분석 결과 (말별 점수) */
export interface HorseAnalysisItem {
  hrNo: string;
  score?: number;
  ratingScore?: number;
  momentumScore?: number;
  experienceBonus?: number;
}

/** Gemini JSON 응답 */
export interface GeminiPredictionJson {
  scores?: {
    horseScores?: Array<{
      hrNo: string;
      hrName: string;
      score: number;
      reason?: string;
      strengths?: string[];
      weaknesses?: string[];
      confidence?: string;
    }>;
  };
  analysis?: string;
  preview?: string;
}
