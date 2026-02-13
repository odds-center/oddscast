import { ApiResponse } from '@/lib/types/api';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';

/**
 * 예측권 구매 요청
 */
export interface PurchaseTicketRequest {
  quantity?: number;
  paymentMethod?: string;
  pgTransactionId?: string;
}

/**
 * 구매 결과
 */
export interface PurchaseResult {
  purchaseId: string;
  tickets: { id: string; [key: string]: unknown }[];
  totalAmount: number;
  paymentMethod: string;
  pgTransactionId: string;
  purchasedAt: string;
}

/**
 * 개별 구매 API
 */
export default class SinglePurchasesApi {
  /**
   * 예측권 구매
   */
  static async purchase(data: PurchaseTicketRequest): Promise<PurchaseResult> {
    try {
      const response = await axiosInstance.post<ApiResponse<PurchaseResult>>(
        '/single-purchases/purchase',
        data,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 가격 계산 (할인 적용)
   */
  static async calculatePrice(quantity: number): Promise<{ quantity: number; totalPrice: number }> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<{ quantity: number; totalPrice: number }>
      >('/single-purchases/calculate-price', {
        params: { quantity },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 구매 내역 조회
   */
  static async getHistory(limit = 50, offset = 0) {
    try {
      const response = await axiosInstance.get<ApiResponse<any[]>>('/single-purchases/history', {
        params: { limit, offset },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 총 구매액 조회
   */
  static async getTotalSpent(): Promise<{ totalSpent: number }> {
    try {
      const response = await axiosInstance.get<ApiResponse<{ totalSpent: number }>>(
        '/single-purchases/total-spent',
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}
