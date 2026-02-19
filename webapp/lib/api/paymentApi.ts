import { axiosInstance, handleApiResponse, handleApiError } from '@/lib/api/axios';
import { ApiResponse } from '@/lib/types/api';

/**
 * 구독 결제 요청 (서버 API 스펙)
 * POST /payments/subscribe
 */
export interface ProcessSubscriptionRequest {
  planId: string;
  paymentMethod: string; // 'MOCK' | 'CARD' | ...
}

/**
 * 구독 시작 요청 (Toss 연동 시 사용 - 카드 정보)
 */
export interface SubscribeRequest {
  planId: string;
  cardNumber: string;
  cardExpirationYear: string; // YY
  cardExpirationMonth: string; // MM
  cardPassword: string; // 앞 2자리
  customerBirthday: string; // YYMMDD
  customerName: string;
  customerEmail: string;
}

/**
 * 구독 결제 응답
 */
export interface SubscribeResponse {
  subscriptionId: string;
  ticketsIssued: number;
  nextBillingDate: string;
  paymentKey: string;
}

/**
 * 개별 구매 요청 (결제 완료 후)
 */
export interface PurchaseTicketsRequest {
  ticketCount: number;
  paymentKey: string;
  orderId: string;
  amount: number;
}

/**
 * 개별 구매 응답
 */
export interface PurchaseTicketsResponse {
  ticketsIssued: number;
  transactionId: string;
}

/**
 * 결제 이력
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
 * 결제 API
 */
export default class PaymentsApi {
  /**
   * 구독 결제 처리 (플랜 결제)
   * POST /payments/subscribe — 서버 스펙: { planId, paymentMethod }
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
   * 구독 시작 (Toss 빌링키 발급 + 첫 결제 - 추후 연동)
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
   * 개별 예측권 구매 (모바일에서 결제 완료 후)
   * POST /payments/purchase (baseURL에 /api 포함)
   */
  static async purchaseTickets(data: PurchaseTicketsRequest): Promise<PurchaseTicketsResponse> {
    const response = await axiosInstance.post<ApiResponse<PurchaseTicketsResponse>>(
      '/payments/purchase',
      data,
    );
    return handleApiResponse(response);
  }

  /**
   * 결제 내역 조회
   * GET /payments/history (baseURL에 /api 포함)
   */
  static async getHistory(): Promise<BillingHistory[]> {
    const response = await axiosInstance.get<ApiResponse<BillingHistory[]>>('/payments/history');
    const data = handleApiResponse(response);
    return Array.isArray(data) ? data : [];
  }
}
