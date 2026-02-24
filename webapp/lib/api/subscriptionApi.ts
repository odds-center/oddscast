import { ApiResponse } from '@/lib/types/api';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';

/**
 * Subscription status
 */
export interface SubscriptionStatus {
  id: string;
  userId: string;
  planId: 'PREMIUM';
  price: number;
  status: 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  nextBillingDate: string | null;
  lastBilledAt: string | null;
  startedAt: string;
  cancelledAt: string | null;
  isActive: boolean;
  monthlyTickets: number;
  daysUntilRenewal: number | null;
  /** Returned on subscribe(); used for Toss billing auth */
  customerKey?: string;
}

/**
 * Subscription history item
 */
export interface SubscriptionHistoryItem {
  id: string;
  planId: string;
  status: 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  plan?: { displayName?: string; planName?: string };
}

/**
 * Subscription creation request
 */
export interface CreateSubscriptionRequest {
  planId: string; // SubscriptionPlan.id (UUID)
}

/**
 * Subscription API
 */
export default class SubscriptionsApi {
  /**
   * Subscribe (creates PENDING status)
   * @returns subscription { id, planId, status, ... }
   */
  static async subscribe(data: CreateSubscriptionRequest) {
    try {
      const response = await axiosInstance.post<ApiResponse<SubscriptionStatus>>('/subscriptions/subscribe', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Activate subscription (after payment completion)
   */
  static async activate(subscriptionId: string, billingKey: string) {
    try {
      const response = await axiosInstance.post<ApiResponse<SubscriptionStatus>>(
        `/subscriptions/${subscriptionId}/activate`,
        { billingKey },
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Cancel subscription
   */
  static async cancel(reason?: string) {
    try {
      const response = await axiosInstance.post<ApiResponse<{ message?: string }>>('/subscriptions/cancel', {
        reason,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Get subscription status
   */
  static async getStatus(): Promise<SubscriptionStatus | null> {
    try {
      const response =
        await axiosInstance.get<ApiResponse<SubscriptionStatus | null>>('/subscriptions/status');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Get subscription history (paginated)
   * @returns { subscriptions, total, page, totalPages }
   */
  static async getHistory(
    limit = 10,
    offset = 0,
  ): Promise<{ subscriptions: SubscriptionHistoryItem[]; total: number; page: number; totalPages: number }> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<{ subscriptions: SubscriptionHistoryItem[]; total: number; page: number; totalPages: number }>
      >('/subscriptions/history', {
        params: { limit, offset },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}
