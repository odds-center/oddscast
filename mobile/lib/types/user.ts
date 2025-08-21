// 사용자 관련 타입 정의
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  authProvider: string;
  providerId?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  refreshToken?: string;
  role: string;
  preferences?: {
    theme?: string;
    language?: string;
    notifications?: boolean;
    favoriteMeets?: string[];
    bettingPreferences?: {
      defaultBetAmount?: number;
      favoriteBetTypes?: string[];
      riskTolerance?: string;
    };
  };

  // 마권 통계
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
  totalWinnings: number;
  totalLosses: number;
  roi: number;

  // 계정 정보
  createdAt: string;
  updatedAt: string;

  // 가상 컬럼
  bettingLevel?: string;
  status?: string;
  profileBio?: string;
  achievements?: {
    firstBet?: string;
    firstWin?: string;
    tenBets?: string;
    hundredBets?: string;
    perfectBet?: string;
    streakWins?: number;
    totalEarnings?: number;
  };
}

export interface CreateUserRequest {
  email: string;
  name?: string;
  authProvider: string;
  providerId?: string;
  avatar?: string;
}

export interface UpdateUserRequest {
  name?: string;
  avatar?: string;
  profileBio?: string;
  preferences?: User['preferences'];
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  profileBio?: string;
  bettingLevel?: string;
  totalBets: number;
  winRate: number;
  totalWinnings: number;
  roi: number;
  achievements?: User['achievements'];
}

export interface UserStatistics {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
  totalWinnings: number;
  totalLosses: number;
  roi: number;
  bettingLevel: string;
  streakWins: number;
  averageBetAmount: number;
  favoriteBetTypes: string[];
  recentPerformance: Array<{
    date: string;
    bets: number;
    wins: number;
    amount: number;
  }>;
}

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  isUnlocked: boolean;
}

// API 요청/응답을 위한 추가 타입들
export interface UserFilters {
  isActive?: boolean;
  isVerified?: boolean;
  role?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface UserSearchFilters {
  query: string;
  role?: string;
  status?: string;
  isActive?: boolean;
  isVerified?: boolean;
  page?: number;
  limit?: number;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UserSearchResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UserActivity {
  id: string;
  userId: string;
  type:
    | 'LOGIN'
    | 'LOGOUT'
    | 'BET_CREATED'
    | 'BET_WON'
    | 'BET_LOST'
    | 'PROFILE_UPDATED'
    | 'PASSWORD_CHANGED';
  description: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    betId?: string;
    betAmount?: number;
    [key: string]: any;
  };
  createdAt: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  type: 'BET_RESULT' | 'POINT_EXPIRY' | 'SYSTEM' | 'PROMOTION' | 'ACHIEVEMENT';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: {
    betId?: string;
    raceId?: string;
    promotionId?: string;
    [key: string]: any;
  };
  createdAt: string;
  readAt?: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'ko' | 'en' | 'ja' | 'zh';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    betResults: boolean;
    pointExpiry: boolean;
    promotions: boolean;
    achievements: boolean;
  };
  bettingPreferences: {
    defaultBetAmount: number;
    favoriteBetTypes: string[];
    riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
    autoConfirmBets: boolean;
    maxBetAmount: number;
  };
  favoriteMeets: string[];
  createdAt: string;
  updatedAt: string;
}
