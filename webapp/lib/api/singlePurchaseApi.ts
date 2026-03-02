import { ApiResponse } from '@/lib/types/api';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';

/**
 * Prediction ticket purchase request
 */
export interface PurchaseTicketRequest {
  quantity?: number;
  paymentMethod?: string;
  pgTransactionId?: string;
}

/**
 * Purchase result
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
 * Individual purchase API
 */
export default class SinglePurchasesApi {
  /**
   * Purchase prediction tickets
   */
  static async purchase(data: PurchaseTicketRequest): Promise<PurchaseResult> {
    try {
      const response = await axiosInstance.post<ApiResponse<PurchaseResult>>(
        '/single-purchases/purchase',
        data,
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /**
   * Calculate price (discount applied)
   */
  static async calculatePrice(quantity: number): Promise<{ quantity: number; totalPrice: number }> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<{ quantity: number; totalPrice: number }>
      >('/single-purchases/calculate-price', {
        params: { quantity },
      });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /**
   * Get purchase history
   */
  static async getHistory(limit = 50, offset = 0) {
    try {
      const response = await axiosInstance.get<ApiResponse<unknown[]>>('/single-purchases/history', {
        params: { limit, offset },
      });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /**
   * Get total purchase amount
   */
  static async getTotalSpent(): Promise<{ totalSpent: number }> {
    try {
      const response = await axiosInstance.get<ApiResponse<{ totalSpent: number }>>(
        '/single-purchases/total-spent',
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }
}
