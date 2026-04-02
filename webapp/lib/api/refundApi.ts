import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';

export interface RefundRequestItem {
  id: string;
  userId: number;
  type: string;
  billingHistoryId: number | null;
  subscriptionId: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  originalAmount: number;
  requestedAmount: number;
  approvedAmount: number | null;
  usedTickets: number;
  totalTickets: number;
  daysSincePayment: number;
  isEligible: boolean;
  ineligibilityReason: string | null;
  userReason: string;
  adminNote: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRefundRequestBody {
  billingHistoryId: number;
  userReason: string;
}

/**
 * Refund request API client.
 * Endpoints: POST /refunds, GET /refunds/my
 */
export default class RefundApi {
  /**
   * Submit a refund request for a billing history entry.
   * Requires authentication.
   */
  static async requestRefund(dto: CreateRefundRequestBody): Promise<RefundRequestItem> {
    try {
      const response = await axiosInstance.post<RefundRequestItem>('/refunds', dto);
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /**
   * Get current user's own refund requests.
   * Requires authentication.
   */
  static async getMyRefunds(): Promise<RefundRequestItem[]> {
    try {
      const response = await axiosInstance.get<RefundRequestItem[]>('/refunds/my');
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }
}
