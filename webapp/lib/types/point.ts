/**
 * 포인트 타입 — @goldenrace/shared 기반
 */
import {
  PointTransactionType,
  PointStatus,
} from '@goldenrace/shared';
import type {
  UserPointBalance,
  PointTransaction,
  TicketPrice,
} from '@goldenrace/shared';
export { PointTransactionType, PointStatus } from '@goldenrace/shared';
export type { UserPointBalance, PointTransaction, TicketPrice } from '@goldenrace/shared';

/** UserPoints = PointTransaction (레거시 호환) */
export type UserPoints = import('@goldenrace/shared').PointTransaction;

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
