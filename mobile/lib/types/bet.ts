// 마권 관련 타입 정의
export enum BetType {
  WIN = 'WIN', // 단승식
  PLACE = 'PLACE', // 복승식
  QUINELLA = 'QUINELLA', // 연승식
  QUINELLA_PLACE = 'QUINELLA_PLACE', // 복연승식
  EXACTA = 'EXACTA', // 쌍승식
  TRIFECTA = 'TRIFECTA', // 삼복승식
  TRIPLE = 'TRIPLE', // 삼쌍승식
}

export enum BetStatus {
  PENDING = 'PENDING', // 대기중
  CONFIRMED = 'CONFIRMED', // 확정
  CANCELLED = 'CANCELLED', // 취소
  COMPLETED = 'COMPLETED', // 완료
  WON = 'WON', // 당첨
  LOST = 'LOST', // 미당첨
}

export enum BetResult {
  PENDING = 'PENDING', // 대기중
  WIN = 'WIN', // 당첨
  LOSE = 'LOSE', // 미당첨
  PARTIAL_WIN = 'PARTIAL_WIN', // 부분당첨
  VOID = 'VOID', // 무효
}

export interface Bet {
  id: string;
  userId: string;
  raceId: string;
  betType: BetType;
  betName: string;
  betDescription?: string;
  betAmount: number;
  potentialWin?: number;
  odds?: number;
  selections: {
    horses: string[];
    positions?: number[];
    combinations?: string[][];
  };
  betStatus: BetStatus;
  betResult: BetResult;
  betTime: Date; // 직접 만든 스키마 - Date
  raceTime?: Date; // 직접 만든 스키마 - Date
  resultTime?: Date; // 직접 만든 스키마 - Date
  raceResult?: {
    winner: string;
    second: string;
    third: string;
    finishOrder: string[];
  };
  actualWin?: number;
  actualOdds?: number;
  confidenceLevel?: number;
  betReason?: string;
  analysisData?: {
    horseForm: Record<string, any>;
    trackCondition: string;
    weather: string;
    jockeyForm: Record<string, any>;
    trainerForm: Record<string, any>;
    historicalPerformance: Record<string, any>;
  };
  apiVersion: string;
  dataSource: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date; // 직접 만든 스키마 - Date
  updatedAt: Date; // 직접 만든 스키마 - Date
  roi?: number;
  riskLevel?: string;
  isFavorite?: boolean;
  notes?: string;
}

export interface CreateBetRequest {
  raceId: string;
  betType: BetType;
  betName: string;
  betDescription?: string;
  betAmount: number;
  selections: {
    horses: string[];
    positions?: number[];
    combinations?: string[][];
  };
  betReason?: string;
  confidenceLevel?: number;
  analysisData?: Bet['analysisData'];
}

export interface UpdateBetRequest {
  betName?: string;
  betDescription?: string;
  betAmount?: number;
  selections?: Bet['selections'];
  betReason?: string;
  betStatus?: BetStatus;
  betResult?: BetResult;
  odds?: number;
  confidenceLevel?: number;
  analysisData?: Bet['analysisData'];
  notes?: string;
}

export interface BetFilters {
  userId?: string;
  raceId?: string;
  betType?: BetType;
  betStatus?: BetStatus;
  betResult?: BetResult;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface BetStatistics {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
  totalWinnings: number;
  totalLosses: number;
  roi: number;
  averageBetAmount: number;
  favoriteBetType?: string;
  recentPerformance?: any[];
  totalAmount?: number;
  averageOdds?: number;
  byType?: Record<BetType, { count: number; amount: number; winnings: number }>;
  byStatus?: Record<BetStatus, { count: number; amount: number }>;
  byResult?: Record<BetResult, { count: number; amount: number; winnings: number }>;
}

export interface BetAnalysis {
  betId: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedValue: number;
  confidence: number;
  recommendations: string[];
}

export interface BetSlip {
  id: string;
  raceId: string;
  bets: {
    betType: BetType;
    amount: number;
    selections: {
      horses: string[];
      positions?: number[];
      combinations?: string[][];
    };
  }[];
  totalAmount: number;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
}

export interface BetHistory {
  bets: Bet[];
  total: number;
  page: number;
  totalPages: number;
}

// 승식 정보
export interface BetTypeInfo {
  value: BetType;
  label: string;
  description: string;
  maxHorses: number;
  minHorses: number;
  example: string;
}

// 마권 상수
export const BET_CONSTANTS = {
  MIN_BET_AMOUNT: 100,
  MAX_BET_AMOUNT: 100000,
  DEFAULT_BET_AMOUNT: 1000,
  BET_AMOUNT_STEPS: [100, 500, 1000, 2000, 5000, 10000, 20000, 50000],
  MAX_BETS_PER_RACE: 10,
  MAX_BET_AMOUNT_PER_RACE: 1000000,
} as const;

// 승식 정보 배열
export const BET_TYPES: BetTypeInfo[] = [
  {
    value: BetType.WIN,
    label: '단승식',
    description: '1등으로 들어올 마를 맞추는 마권',
    maxHorses: 1,
    minHorses: 1,
    example: '3번마가 1등으로 들어올 것',
  },
  {
    value: BetType.PLACE,
    label: '복승식',
    description: '1등, 2등, 3등 중 하나로 들어올 마를 맞추는 마권',
    maxHorses: 1,
    minHorses: 1,
    example: '3번마가 1등, 2등, 3등 중 하나로 들어올 것',
  },
  {
    value: BetType.QUINELLA,
    label: '연승식',
    description: '1등과 2등을 순서 무관하게 맞추는 마권',
    maxHorses: 2,
    minHorses: 2,
    example: '3번마와 7번마가 1등, 2등으로 들어올 것',
  },
  {
    value: BetType.QUINELLA_PLACE,
    label: '복연승식',
    description: '2마리가 1등, 2등, 3등 중 두 자리를 하는 마권',
    maxHorses: 2,
    minHorses: 2,
    example: '3번마와 7번마가 1등, 2등, 3등 중 두 자리를 할 것',
  },
  {
    value: BetType.EXACTA,
    label: '쌍승식',
    description: '1등과 2등을 정확한 순서로 맞추는 마권',
    maxHorses: 2,
    minHorses: 2,
    example: '3번마가 1등, 7번마가 2등으로 들어올 것',
  },
  {
    value: BetType.TRIFECTA,
    label: '삼복승식',
    description: '3마리가 1등, 2등, 3등을 순서 무관하게 맞추는 마권',
    maxHorses: 3,
    minHorses: 3,
    example: '3번마, 7번마, 12번마가 1등, 2등, 3등을 할 것',
  },
  {
    value: BetType.TRIPLE,
    label: '삼쌍승식',
    description: '3마리가 1등, 2등, 3등을 정확한 순서로 맞추는 마권',
    maxHorses: 3,
    minHorses: 3,
    example: '3번마가 1등, 7번마가 2등, 12번마가 3등으로 들어올 것',
  },
];
