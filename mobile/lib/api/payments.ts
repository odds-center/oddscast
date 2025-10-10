import { ApiResponse } from '@/lib/types/api';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/utils/axios';

/**
 * 결제 승인 요청
 */
export interface ConfirmPaymentRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

/**
 * 빌링키 발급 요청
 */
export interface IssueBillingKeyRequest {
  customerKey: string;
  authKey: string;
}

/**
 * 빌링키 결제 요청
 */
export interface BillingPaymentRequest {
  billingKey: string;
  amount: number;
  orderName: string;
}

/**
 * 결제 취소 요청
 */
export interface CancelPaymentRequest {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
}

/**
 * 결제 API
 */
export class PaymentsApi {
  /**
   * 결제 승인 (즉시 결제)
   */
  static async confirm(data: ConfirmPaymentRequest) {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>('/payments/confirm', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 빌링키 발급 (정기 결제용)
   */
  static async issueBillingKey(data: IssueBillingKeyRequest) {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>('/payments/billing-key', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 빌링키로 결제
   */
  static async payWithBillingKey(data: BillingPaymentRequest) {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>('/payments/billing-pay', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 결제 취소
   */
  static async cancel(data: CancelPaymentRequest) {
    try {
      const response = await axiosInstance.post<ApiResponse<any>>('/payments/cancel', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

// 기본 export
export const paymentsApi = PaymentsApi;
