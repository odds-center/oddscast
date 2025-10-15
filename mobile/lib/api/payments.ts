import { axiosInstance } from '../utils/axios';

/**
 * 구독 시작 요청
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
export const paymentsApi = {
  /**
   * 구독 시작 (빌링키 발급 + 첫 결제)
   * POST /api/payments/subscribe
   */
  async subscribe(data: SubscribeRequest): Promise<SubscribeResponse> {
    const response = await axiosInstance.post<SubscribeResponse>('/api/payments/subscribe', data);
    return response.data;
  },

  /**
   * 개별 예측권 구매 (모바일에서 결제 완료 후)
   * POST /api/payments/purchase
   */
  async purchaseTickets(data: PurchaseTicketsRequest): Promise<PurchaseTicketsResponse> {
    const response = await axiosInstance.post<PurchaseTicketsResponse>(
      '/api/payments/purchase',
      data
    );
    return response.data;
  },

  /**
   * 결제 내역 조회
   * GET /api/payments/history
   */
  async getHistory(): Promise<BillingHistory[]> {
    const response = await axiosInstance.get<BillingHistory[]>('/api/payments/history');
    return response.data;
  },
};
