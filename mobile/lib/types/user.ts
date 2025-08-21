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
  lastLogin?: Date; // 직접 만든 스키마 - Date
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

  // 계정 정보 (직접 만든 스키마)
  createdAt: Date; // Date 타입
  updatedAt: Date; // Date 타입

  // 가상 컬럼
  bettingLevel?: string;
  status?: string;
  profileBio?: string;
  achievements?: {
    firstBet?: Date; // 직접 만든 스키마 - Date
    firstWin?: Date; // 직접 만든 스키마 - Date
    tenBets?: Date; // 직접 만든 스키마 - Date
    hundredBets?: Date; // 직접 만든 스키마 - Date
    perfectBet?: Date; // 직접 만든 스키마 - Date
    streakWins?: number;
    totalEarnings?: number;
    level?: number;
    experience?: number;
  };

  // 소셜 계정 정보
  socialAccounts?: {
    google?: {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };
    kakao?: {
      id: string;
      email?: string;
      nickname?: string;
      profileImage?: string;
    };
    naver?: {
      id: string;
      email?: string;
      nickname?: string;
      profileImage?: string;
    };
  };

  // 보안 설정
  twoFactorEnabled?: boolean;
  lastPasswordChange?: Date; // 직접 만든 스키마 - Date
  failedLoginAttempts?: number;
  accountLockedUntil?: Date; // 직접 만든 스키마 - Date

  // 알림 설정
  notificationSettings?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    bettingResults: boolean;
    promotions: boolean;
    news: boolean;
  };

  // 언어 및 지역 설정
  locale?: string;
  timezone?: string;
  currency?: string;

  // 프로필 정보
  phoneNumber?: string;
  dateOfBirth?: Date; // 직접 만든 스키마 - Date
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address?: {
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    addressLine1?: string;
    addressLine2?: string;
  };

  // 계정 상태
  accountStatus?: 'active' | 'suspended' | 'banned' | 'pending_verification';
  verificationStatus?: {
    email: boolean;
    phone: boolean;
    identity: boolean;
    address: boolean;
  };

  // 마지막 활동 (직접 만든 스키마)
  lastActivity?: Date; // Date 타입
  lastBetTime?: Date; // Date 타입
  lastLoginTime?: Date; // Date 타입

  // 통계 정보
  totalDeposits?: number;
  totalWithdrawals?: number;
  accountBalance?: number;
  loyaltyPoints?: number;
  memberSince?: Date; // 직접 만든 스키마 - Date
  vipLevel?: number;
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
  recentPerformance: {
    date: string;
    bets: number;
    wins: number;
    amount: number;
  }[];
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
  dateFrom?: Date; // 필터용 - Date
  dateTo?: Date; // 필터용 - Date
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
  createdAt: Date; // 직접 만든 스키마 - Date
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
  createdAt: Date; // 직접 만든 스키마 - Date
  readAt?: Date; // 직접 만든 스키마 - Date
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
  createdAt: Date; // 직접 만든 스키마 - Date
  updatedAt: Date; // 직접 만든 스키마 - Date
}
