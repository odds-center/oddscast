// 포인트 관련 타입 정의
export enum PointTransactionType {
  EARNED = 'EARNED', // 획득
  SPENT = 'SPENT', // 사용
  REFUNDED = 'REFUNDED', // 환불
  BONUS = 'BONUS', // 보너스
  PROMOTION = 'PROMOTION', // 프로모션
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT', // 관리자 조정
  EXPIRED = 'EXPIRED', // 만료
  TRANSFER_IN = 'TRANSFER_IN', // 이체 입금
  TRANSFER_OUT = 'TRANSFER_OUT', // 이체 출금
}

export enum PointStatus {
  ACTIVE = 'ACTIVE', // 활성
  PENDING = 'PENDING', // 대기중
  EXPIRED = 'EXPIRED', // 만료됨
  CANCELLED = 'CANCELLED', // 취소됨
  PROCESSING = 'PROCESSING', // 처리중
}

export interface UserPointBalance {
  userId: string;
  currentPoints: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  bonusPoints: number;
  expiringPoints: number;
  lastUpdated: Date; // 직접 만든 스키마 - Date
  createdAt: Date; // 직접 만든 스키마 - Date
  updatedAt: Date; // 직접 만든 스키마 - Date
}

export interface UserPoints {
  id: string;
  userId: string;
  transactionType: string; // 서버의 실제 필드명
  amount: number;
  balanceAfter: number;
  description: string;
  transactionTime: Date; // 직접 만든 스키마 - Date
  status: PointStatus;
  metadata?: {
    betId?: string;
    raceId?: string;
    promotionId?: string;
    adminNote?: string;
    [key: string]: any;
  };
  createdAt: Date; // 직접 만든 스키마 - Date
  updatedAt: Date; // 직접 만든 스키마 - Date
}

export interface CreatePointTransactionRequest {
  userId: string;
  type: PointTransactionType;
  amount: number;
  description: string;
  metadata?: UserPoints['metadata'];
  expiresAt?: Date; // 직접 만든 스키마 - Date
}

export interface PointTransactionFilters {
  userId?: string;
  type?: PointTransactionType;
  status?: PointStatus;
  dateFrom?: Date; // 필터용 - Date
  dateTo?: Date; // 필터용 - Date
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export interface PointStatistics {
  totalTransactions: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  netPoints: number;
  averageTransactionAmount: number;
  byType: Record<
    PointTransactionType,
    {
      count: number;
      totalAmount: number;
      averageAmount: number;
    }
  >;
  byStatus: Record<
    PointStatus,
    {
      count: number;
      totalAmount: number;
    }
  >;
  recentTransactions: UserPoints[];
  expiringPoints: {
    amount: number;
    expiresAt: Date; // 직접 만든 스키마 - Date
    daysUntilExpiry: number;
  }[];
}

export interface PointTransferRequest {
  fromUserId: string;
  toUserId: string;
  amount: number;
  description: string;
  fee?: number;
}

export interface PointTransferResponse {
  transferId: string;
  fromUser: {
    id: string;
    name: string;
    balanceAfter: number;
  };
  toUser: {
    id: string;
    name: string;
    balanceAfter: number;
  };
  amount: number;
  fee: number;
  netAmount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: Date; // 직접 만든 스키마 - Date
}

export interface PointPromotion {
  id: string;
  name: string;
  description: string;
  type: 'SIGNUP_BONUS' | 'REFERRAL_BONUS' | 'DAILY_LOGIN' | 'SPECIAL_EVENT' | 'CUSTOM';
  points: number;
  conditions: {
    minBetAmount?: number;
    minBetCount?: number;
    validBetTypes?: string[];
    validRaces?: string[];
    validUsers?: string[];
    [key: string]: any;
  };
  startDate: Date; // 직접 만든 스키마 - Date
  endDate: Date; // 직접 만든 스키마 - Date
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  createdAt: Date; // 직접 만든 스키마 - Date
  updatedAt: Date; // 직접 만든 스키마 - Date
}

export interface PointExpiryNotification {
  userId: string;
  expiringPoints: number;
  expiryDate: Date; // 직접 만든 스키마 - Date
  daysUntilExpiry: number;
  notificationSent: boolean;
  lastNotificationSent?: Date; // 직접 만든 스키마 - Date
}

export interface PointAuditLog {
  id: string;
  userId: string;
  action:
    | 'TRANSACTION_CREATED'
    | 'TRANSACTION_UPDATED'
    | 'TRANSACTION_CANCELLED'
    | 'BALANCE_ADJUSTED'
    | 'PROMOTION_APPLIED';
  details: {
    transactionId?: string;
    oldBalance?: number;
    newBalance?: number;
    adjustmentReason?: string;
    adminUserId?: string;
    [key: string]: any;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date; // 직접 만든 스키마 - Date
}

export interface PointSettings {
  id: string;
  key: string;
  value: string;
  description: string;
  isEditable: boolean;
  category: 'GENERAL' | 'TRANSACTIONS' | 'PROMOTIONS' | 'EXPIRY' | 'TRANSFERS';
  updatedAt: Date; // 직접 만든 스키마 - Date
}

export interface PointReport {
  period: {
    startDate: Date; // 직접 만든 스키마 - Date
    endDate: Date; // 직접 만든 스키마 - Date
  };
  summary: {
    totalTransactions: number;
    totalPointsEarned: number;
    totalPointsSpent: number;
    netPoints: number;
    activeUsers: number;
    newUsers: number;
  };
  breakdown: {
    byDay: {
      date: Date; // 직접 만든 스키마 - Date
      transactions: number;
      pointsEarned: number;
      pointsSpent: number;
    }[];
    byType: Record<
      PointTransactionType,
      {
        count: number;
        amount: number;
      }
    >;
    byUser: {
      userId: string;
      userName: string;
      transactions: number;
      netPoints: number;
    }[];
  };
}

// API 요청/응답을 위한 추가 타입들
export interface CreatePointRequest {
  amount: number;
  description: string;
  type?: PointTransactionType;
  expiresAt?: Date; // 직접 만든 스키마 - Date
  metadata?: UserPoints['metadata'];
}

export interface UpdatePointRequest {
  amount?: number;
  description?: string;
  status?: PointStatus;
  expiresAt?: Date; // 직접 만든 스키마 - Date
  metadata?: UserPoints['metadata'];
}

export interface PointListResponse {
  transactions: UserPoints[]; // 서버의 실제 응답 구조
  total: number;
  page: number;
  totalPages: number;
}

export interface PointSearchFilters {
  query?: string;
  type?: PointTransactionType;
  status?: PointStatus;
  dateFrom?: Date; // 필터용 - Date
  dateTo?: Date; // 필터용 - Date
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export interface PointBalanceResponse {
  balance: UserPointBalance;
  recentTransactions: UserPoints[];
  expiringPoints: {
    amount: number;
    expiresAt: Date; // 직접 만든 스키마 - Date
    daysUntilExpiry: number;
  }[];
}

export interface PointAdjustmentRequest {
  userId: string;
  amount: number;
  reason: string;
  adminNote?: string;
  type: 'ADMIN_ADJUSTMENT' | 'REFUND' | 'CORRECTION';
}

export interface PointExpirySettings {
  defaultExpiryDays: number;
  bonusExpiryDays: number;
  promotionExpiryDays: number;
  allowExtension: boolean;
  maxExtensionDays: number;
  notificationDays: number[];
}
