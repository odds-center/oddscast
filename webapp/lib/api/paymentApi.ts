import { axiosInstance, handleApiResponse, handleApiError } from '@/lib/api/axios';
import { ApiResponse } from '@/lib/types/api';

/**
 * Subscription payment request (server API spec)
 * POST /payments/subscribe
 */
export interface ProcessSubscriptionRequest {
  planId: string;
  paymentMethod: string; // 'MOCK' | 'CARD' | ...
}

/**
 * Subscription start request (used for Toss integration - card info)
 */
export interface SubscribeRequest {
  planId: string;
  cardNumber: string;
  cardExpirationYear: string; // YY
  cardExpirationMonth: string; // MM
  cardPassword: string; // First 2 digits
  customerBirthday: string; // YYMMDD
  customerName: string;
  customerEmail: string;
}

/**
 * Subscription payment response
 */
export interface SubscribeResponse {
  subscriptionId: string;
  ticketsIssued: number;
  nextBillingDate: string;
  paymentKey: string;
}

/**
 * Individual purchase request (after payment completion)
 */
export interface PurchaseTicketsRequest {
  ticketCount: number;
  paymentKey: string;
  orderId: string;
  amount: number;
}

/**
 * Individual purchase response
 */
export interface PurchaseTicketsResponse {
  ticketsIssued: number;
  transactionId: string;
}

/**
 * Payment history
 */
export interface BillingHistory {
  id: string;
  amount: number;
  billingDate: string;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  pgProvider: string;
  pgTransactionId: string;
  errorMessage?: string;
}

/**
 * Payment API
 */
export default class PaymentsApi {
  /**
   * After Toss billing auth success redirect: exchange authKey for billingKey, run first payment, activate subscription.
   * POST /payments/billing-key
   */
  static async billingKeyAndConfirm(params: {
    subscriptionId: string;
    customerKey: string;
    authKey: string;
  }): Promise<{ success: boolean; subscription?: unknown; paymentKey?: string; orderId?: string }> {
    try {
      const response = await axiosInstance.post<
        ApiResponse<{ success: boolean; subscription?: unknown; paymentKey?: string; orderId?: string }>
      >('/payments/billing-key', params);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Process subscription payment (plan payment)
   * POST /payments/subscribe — Server spec: { planId, paymentMethod }
   */
  static async processSubscription(
    data: ProcessSubscriptionRequest,
  ): Promise<{ billing: BillingHistory; planName: string }> {
    try {
      const response = await axiosInstance.post<ApiResponse<{ billing: BillingHistory; planName: string }>>('/payments/subscribe', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Start subscription (Toss billing key issuance + first payment - future integration)
   * POST /api/payments/subscribe
   */
  static async subscribe(data: SubscribeRequest): Promise<SubscribeResponse> {
    const response = await axiosInstance.post<{ data?: SubscribeResponse } | SubscribeResponse>(
      '/payments/subscribe',
      data,
    );
    const body = response.data as { data?: SubscribeResponse } | SubscribeResponse;
    return (body as { data?: SubscribeResponse })?.data ?? (body as SubscribeResponse);
  }

  /**
   * Purchase individual prediction tickets (after payment completion on mobile)
   * POST /payments/purchase (baseURL includes /api)
   */
  static async purchaseTickets(data: PurchaseTicketsRequest): Promise<PurchaseTicketsResponse> {
    const response = await axiosInstance.post<ApiResponse<PurchaseTicketsResponse>>(
      '/payments/purchase',
      data,
    );
    return handleApiResponse(response);
  }

  /**
   * Get payment history
   * GET /payments/history (baseURL includes /api)
   */
  static async getHistory(): Promise<BillingHistory[]> {
    const response = await axiosInstance.get<ApiResponse<BillingHistory[]>>('/payments/history');
    const data = handleApiResponse(response);
    return Array.isArray(data) ? data : [];
  }
}
