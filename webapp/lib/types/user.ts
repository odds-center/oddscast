// User-related type definitions
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  authProvider: string;
  providerId?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date; // Custom schema - Date
  refreshToken?: string;
  role: string;
  /** Saved meet filter for races list (FEATURE_ROADMAP 5.2): 서울|제주|부산경남 */
  favoriteMeet?: string | null;
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

  // Bet statistics
  totalBets: number;
  wonBets: number;
  lostBets: number;
  winRate: number;
  totalWinnings: number;
  totalLosses: number;
  roi: number;

  // Account information (custom schema)
  createdAt: Date; // Date type
  updatedAt: Date; // Date type

  // Virtual columns
  bettingLevel?: string;
  status?: string;
  profileBio?: string;
  achievements?: {
    firstBet?: Date; // Custom schema - Date
    firstWin?: Date; // Custom schema - Date
    tenBets?: Date; // Custom schema - Date
    hundredBets?: Date; // Custom schema - Date
    perfectBet?: Date; // Custom schema - Date
    streakWins?: number;
    totalEarnings?: number;
    level?: number;
    experience?: number;
  };

  // Social account information
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

  // Security settings
  twoFactorEnabled?: boolean;
  lastPasswordChange?: Date; // Custom schema - Date
  failedLoginAttempts?: number;
  accountLockedUntil?: Date; // Custom schema - Date

  // Notification settings
  notificationSettings?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    bettingResults: boolean;
    promotions: boolean;
    news: boolean;
  };

  // Language and region settings
  locale?: string;
  timezone?: string;
  currency?: string;

  // Profile information
  phoneNumber?: string;
  dateOfBirth?: Date; // Custom schema - Date
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address?: {
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    addressLine1?: string;
    addressLine2?: string;
  };

  // Account status
  accountStatus?: 'active' | 'suspended' | 'banned' | 'pending_verification';
  verificationStatus?: {
    email: boolean;
    phone: boolean;
    identity: boolean;
    address: boolean;
  };

  // Last activity (custom schema)
  lastActivity?: Date; // Date type
  lastBetTime?: Date; // Date type
  lastLoginTime?: Date; // Date type

  // Statistics information
  totalDeposits?: number;
  totalWithdrawals?: number;
  accountBalance?: number;
  loyaltyPoints?: number;
  memberSince?: Date; // Custom schema - Date
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

// Additional types for API requests/responses
export interface UserFilters {
  isActive?: boolean;
  isVerified?: boolean;
  role?: string;
  status?: string;
  dateFrom?: Date; // For filtering - Date
  dateTo?: Date; // For filtering - Date
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
    [key: string]: unknown;
  };
  createdAt: Date; // Custom schema - Date
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
    [key: string]: unknown;
  };
  createdAt: Date; // Custom schema - Date
  readAt?: Date; // Custom schema - Date
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
  createdAt: Date; // Custom schema - Date
  updatedAt: Date; // Custom schema - Date
}
