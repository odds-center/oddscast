/**
 * Admin API 타입 정의
 */

// Dashboard
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  todayRaces: number;
  todayBets: {
    count: number;
    amount: number;
  };
  totalBets: {
    count: number;
    amount: number;
    winAmount: number;
  };
  activeSubscriptions: number;
}

// Users
export interface User {
  id: number | string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  availableTickets?: number;
  totalTickets?: number;
  totalBets?: number;
  wonBets?: number;
  totalBetAmount?: number;
  totalWinAmount?: number;
}

export interface UserListResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Bets
export interface Bet {
  id: string;
  userId: string;
  raceId: string;
  betType: string;
  betName?: string;
  betAmount: number;
  betStatus: string;
  betResult?: string;
  actualWin?: number;
  potentialWin?: number;
  odds?: number;
  betTime: string;
  createdAt?: string;
  race?: { id: string; rcDate: string; meet: string; rcNo: string };
  user?: { id: string; email: string; name: string };
}

export interface BetListResponse {
  data: Bet[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Races
export interface Race {
  raceId: string;
  rcDate: string;
  meet: string;
  rcNo: number;
  rcName: string;
  rcDist: number;
  rcTime: string;
  totalStakes?: number;
}

// Subscriptions
export interface SubscriptionPlan {
  id: string;
  planName: string;
  displayName: string;
  description: string;
  originalPrice: number;
  vat: number;
  totalPrice: number;
  baseTickets: number;
  bonusTickets: number;
  totalTickets: number;
  isActive: boolean;
  sortOrder: number;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

// Single Purchase Config
export interface SinglePurchaseConfig {
  id: string;
  configName: string;
  displayName: string;
  description: string;
  originalPrice: number;
  vat: number;
  totalPrice: number;
  isActive: boolean;
}

// AI Predictions
export interface AIPrediction {
  id: string;
  raceId: string;
  predictedFirst: number;
  predictedSecond: number;
  predictedThird: number;
  confidence: number;
  analysis: string;
  modelVersion: string;
  llmProvider: string;
  tokensUsed: number;
  cost: number;
  predictedAt: string;
  actualFirst?: number;
  actualSecond?: number;
  actualThird?: number;
  isCorrect?: boolean;
}

// AI Analytics
export interface AIAccuracyDashboard {
  overall: {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    avgConfidence: number;
  };
  byPosition: {
    first: { correct: number; total: number; accuracy: number };
    second: { correct: number; total: number; accuracy: number };
    third: { correct: number; total: number; accuracy: number };
  };
  recent7Days: {
    date: string;
    accuracy: number;
    count: number;
  }[];
  byProvider: {
    provider: string;
    accuracy: number;
    count: number;
    avgCost: number;
  }[];
}

export interface AIDailyStats {
  date: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  totalCost: number;
  avgConfidence: number;
}

export interface AIFailureAnalysis {
  totalFailures: number;
  byReason: {
    reason: string;
    count: number;
    percentage: number;
  }[];
  avgMissDistance: number;
  commonPatterns: string[];
}

// Revenue
export interface RevenueStats {
  period: string;
  subscriptionRevenue: number;
  singlePurchaseRevenue: number;
  totalRevenue: number;
  aiCost: number;
  infrastructureCost: number;
  totalCost: number;
  profit: number;
  margin: number;
}

export interface RevenueProjection {
  month: string;
  projected: number;
  actual: number;
  subscribers: number;
}

// Statistics
export interface UsersGrowth {
  date: string;
  count: number;
}

export interface BetsTrend {
  date: string;
  count: number;
  amount: number;
  winAmount: number;
}

export interface Revenue {
  period: string;
  revenue: number;
  payout: number;
  profit: number;
}
