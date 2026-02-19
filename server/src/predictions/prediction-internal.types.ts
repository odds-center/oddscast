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
  jkNo?: string | null;
  jkName?: string;
  trNo?: string | null;
  trName?: string | null;
  wgBudam?: number;
  rating?: number;
  /** KRA API77: 레이팅 추이 [rating2, rating3, rating4] */
  ratingHistory?: number[] | null;
  chulNo?: string;
  rcCntT?: number;
  ord1CntT?: number;
  recentRanks?: unknown;
  horseWeight?: string;
  equipment?: string;
  bleedingInfo?: unknown;
  isScratched?: boolean;
  /** KRA: 성별 (암/수/거) — 혈통·나이 분석용 */
  sex?: string | null;
  /** KRA: 연령 — 혈통·나이 분석용 */
  age?: number | null;
  /** KRA: 산지(출생지) — 혈통 분석용 */
  prd?: string | null;
  /** KRA: 1착상금 — 저평가 탐지용 */
  chaksun1?: number | null;
  /** KRA: 통산수득상금 (BigInt) — 저평가 탐지용 */
  chaksunT?: bigint | number | null;
  /** 조교사 통산승률 (TrainerResult) — API19_1 */
  trainerWinRate?: number | null;
  /** 조교사 통산복승률 (TrainerResult) — API19_1 */
  trainerQuRate?: number | null;
  /** API37_1 마필 구간별 기록 (s1fAvg, g1fAvg 등) */
  sectionalStats?: unknown;
  /** 구간별 태그 (선행마/추입마/중간마) */
  sectionalTag?: string | null;
  /** 과거 N경기 내 말(hrNo) 낙마 횟수 — fall risk 산출용 */
  fallHistoryHorse?: number;
  /** 과거 N경기 내 기수(jkNo) 낙마 횟수 — fall risk 산출용 */
  fallHistoryJockey?: number;
  trainings?: Array<{
    trDate?: string;
    intensity?: string;
    trTime?: string;
    trContent?: string;
  }>;
  trainingData?: unknown;
}

/** Python 분석 결과 (말별 점수) — v2: 정규화 sub-scores + winProb */
export interface HorseAnalysisItem {
  hrNo: string;
  chulNo?: string | null;
  hrName?: string;
  score?: number;
  /** 하위 점수 (모두 0~100 정규화) */
  sub?: {
    rat?: number;
    frm?: number;
    cnd?: number;
    exp?: number;
    trn?: number;
    suit?: number;
  };
  /** 낙마 리스크 (0~100) */
  risk?: number;
  /** softmax 승률 확률 (%) */
  winProb?: number;
  /** 최근 착순 */
  recentRanks?: number[];
  /** compact 태그 배열 */
  tags?: string[];
  /** DB 저장용 reason */
  reason?: string;
  /** @deprecated v1 호환 */
  ratingScore?: number;
  momentumScore?: number;
  experienceBonus?: number;
  fallRiskScore?: number;
}

/** 승식별 예측 — Gemini가 각 승식별로 별도 추천 출력 */
export interface BetTypePredictionSingle {
  hrNo: string;
  reason?: string;
}
export interface BetTypePredictionPair {
  hrNos: [string, string];
  reason?: string;
}
export interface BetTypePredictionExacta {
  first: string; // 1등 hrNo
  second: string; // 2등 hrNo
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

/** 2마리/3마리 승식 — 3개 조합 (연승·쌍승·복연승·삼복승·삼쌍승) */
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
  /** 단승식: 1등 1마리 */
  SINGLE?: BetTypePredictionSingle;
  /** 복승식: 1~3등 1마리 */
  PLACE?: BetTypePredictionSingle;
  /** 연승식: 3개 조합 */
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
  /** 승식별 별도 AI 예측 — 각 승식마다 구체적 추천 */
  betTypePredictions?: BetTypePredictions;
  analysis?: string;
  preview?: string;
}
