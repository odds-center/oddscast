/**
 * Point type — based on @oddscast/shared
 */
import {
  PointTransactionType,
  PointStatus,
  type UserPointBalance,
} from '@oddscast/shared';
export { PointTransactionType, PointStatus } from '@oddscast/shared';
export type { UserPointBalance, PointTransaction, TicketPrice } from '@oddscast/shared';

/** UserPoints = PointTransaction (legacy compatibility) */
export type UserPoints = import('@oddscast/shared').PointTransaction;

export interface CreatePointTransactionRequest {
  userId: string;
  type: PointTransactionType;
  amount: number;
  description: string;
  metadata?: UserPoints['metadata'];
  expiresAt?: Date; // Custom schema - Date
}

export interface PointTransactionFilters {
  userId?: string;
  type?: PointTransactionType;
  status?: PointStatus;
  dateFrom?: Date; // For filtering - Date
  dateTo?: Date; // For filtering - Date
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
    expiresAt: Date; // Custom schema - Date
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
  createdAt: Date; // Custom schema - Date
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
    [key: string]: unknown;
  };
  startDate: Date; // Custom schema - Date
  endDate: Date; // Custom schema - Date
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  createdAt: Date; // Custom schema - Date
  updatedAt: Date; // Custom schema - Date
}

export interface PointExpiryNotification {
  userId: string;
  expiringPoints: number;
  expiryDate: Date; // Custom schema - Date
  daysUntilExpiry: number;
  notificationSent: boolean;
  lastNotificationSent?: Date; // Custom schema - Date
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
    [key: string]: unknown;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date; // Custom schema - Date
}

export interface PointSettings {
  id: string;
  key: string;
  value: string;
  description: string;
  isEditable: boolean;
  category: 'GENERAL' | 'TRANSACTIONS' | 'PROMOTIONS' | 'EXPIRY' | 'TRANSFERS';
  updatedAt: Date; // Custom schema - Date
}

export interface PointReport {
  period: {
    startDate: Date; // Custom schema - Date
    endDate: Date; // Custom schema - Date
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
      date: Date; // Custom schema - Date
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

// Additional types for API requests/responses
export interface CreatePointRequest {
  amount: number;
  description: string;
  type?: PointTransactionType;
  expiresAt?: Date; // Custom schema - Date
  metadata?: UserPoints['metadata'];
}

export interface UpdatePointRequest {
  amount?: number;
  description?: string;
  status?: PointStatus;
  expiresAt?: Date; // Custom schema - Date
  metadata?: UserPoints['metadata'];
}

export interface PointListResponse {
  transactions: UserPoints[]; // Actual response structure from server
  total: number;
  page: number;
  totalPages: number;
}

export interface PointSearchFilters {
  query?: string;
  type?: PointTransactionType;
  status?: PointStatus;
  dateFrom?: Date; // For filtering - Date
  dateTo?: Date; // For filtering - Date
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
    expiresAt: Date; // Custom schema - Date
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
