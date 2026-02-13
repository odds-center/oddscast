import { ApiResponse } from '@/lib/types/api';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';
import CONFIG from '@/lib/config';
import { mockSubscriptionStatus } from '@/lib/mocks/data';

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
 * 구독 이력 항목
 */
export interface SubscriptionHistoryItem {
  id: string;
  planId: string;
  status: 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  plan?: { displayName?: string; planName?: string };
}

/**
 * 구독 생성 요청
 */
export interface CreateSubscriptionRequest {
  planId: string; // SubscriptionPlan.id (UUID)
}

/**
 * 구독 API
 */
export default class SubscriptionsApi {
  /**
   * 구독 신청 (PENDING 생성)
   * @returns subscription { id, planId, status, ... }
   */
  static async subscribe(data: CreateSubscriptionRequest) {
    if (CONFIG.useMock) return { id: 'mock-sub', status: 'PENDING', planId: data.planId };
    try {
      const response = await axiosInstance.post<ApiResponse<SubscriptionStatus>>('/subscriptions/subscribe', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 구독 활성화 (결제 완료 후)
   */
  static async activate(subscriptionId: string, billingKey: string) {
    if (CONFIG.useMock) return { id: subscriptionId, status: 'ACTIVE' };
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
   * 구독 취소
   */
  static async cancel(reason?: string) {
    if (CONFIG.useMock) return { message: 'OK' };
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
   * 구독 상태 조회
   */
  static async getStatus(): Promise<SubscriptionStatus | null> {
    if (CONFIG.useMock) return mockSubscriptionStatus;
    try {
      const response =
        await axiosInstance.get<ApiResponse<SubscriptionStatus | null>>('/subscriptions/status');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 구독 내역 조회 (페이지네이션)
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
