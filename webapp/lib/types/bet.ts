// Bet-related type definitions
export enum BetType {
  WIN = 'WIN', // Win bet
  PLACE = 'PLACE', // Place bet
  QUINELLA = 'QUINELLA', // Quinella bet
  QUINELLA_PLACE = 'QUINELLA_PLACE', // Quinella Place bet
  EXACTA = 'EXACTA', // Exacta bet
  TRIFECTA = 'TRIFECTA', // Trifecta bet
  TRIPLE = 'TRIPLE', // Triple bet
}

export enum BetStatus {
  PENDING = 'PENDING', // Pending
  CONFIRMED = 'CONFIRMED', // Confirmed
  CANCELLED = 'CANCELLED', // Cancelled
  COMPLETED = 'COMPLETED', // Completed
  WON = 'WON', // Won
  LOST = 'LOST', // Lost
}

export enum BetResult {
  PENDING = 'PENDING', // Pending
  WIN = 'WIN', // Win
  LOSE = 'LOSE', // Lose
  PARTIAL_WIN = 'PARTIAL_WIN', // Partial win
  VOID = 'VOID', // Void
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
  betTime: Date; // Custom schema - Date
  raceTime?: Date; // Custom schema - Date
  resultTime?: Date; // Custom schema - Date
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
    horseForm: Record<string, unknown>;
    trackCondition: string;
    weather: string;
    jockeyForm: Record<string, unknown>;
    trainerForm: Record<string, unknown>;
    historicalPerformance: Record<string, unknown>;
  };
  apiVersion: string;
  dataSource: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date; // Custom schema - Date
  updatedAt: Date; // Custom schema - Date
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
  recentPerformance?: Record<string, unknown>[];
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

// Bet type information
export interface BetTypeInfo {
  value: BetType;
  label: string;
  description: string;
  maxHorses: number;
  minHorses: number;
  example: string;
}

// Bet constants
export const BET_CONSTANTS = {
  MIN_BET_AMOUNT: 100,
  MAX_BET_AMOUNT: 100000,
  DEFAULT_BET_AMOUNT: 1000,
  BET_AMOUNT_STEPS: [100, 500, 1000, 2000, 5000, 10000, 20000, 50000],
  MAX_BETS_PER_RACE: 10,
  MAX_BET_AMOUNT_PER_RACE: 1000000,
} as const;

// Bet type information array
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
