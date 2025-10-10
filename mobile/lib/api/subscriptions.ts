import { ApiResponse } from '@/lib/types/api';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/utils/axios';

/**
 * 구독 상태
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
}

/**
 * 구독 생성 요청
 */
export interface CreateSubscriptionRequest {
  userId: string;
  planId?: 'PREMIUM';
  billingKey?: string;
}

/**
 * 구독 API
 */
export class SubscriptionsApi {
  /**
   * 구독 신청
   */
  static async subscribe(data: CreateSubscriptionRequest) {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>('/subscriptions/subscribe', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 구독 활성화
   */
  static async activate(subscriptionId: string, billingKey: string) {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>(
        `/subscriptions/${subscriptionId}/activate`,
        { billingKey }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 구독 취소
   */
  static async cancel(reason?: string) {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>('/subscriptions/cancel', {
        reason,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 구독 상태 조회
   */
  static async getStatus(): Promise<SubscriptionStatus | null> {
    try {
      const response = await axiosInstance.get<ApiResponse<SubscriptionStatus | null>>(
        '/subscriptions/status'
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 구독 내역 조회
   */
  static async getHistory(limit = 10, offset = 0) {
    try {
      const response = await axiosInstance.get<ApiResponse<any[]>>('/subscriptions/history', {
        params: { limit, offset },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

// 기본 export
export const subscriptionsApi = SubscriptionsApi;
