import { ApiResponse } from '@/lib/types/api';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';
import type { PredictionResultDto } from '@/lib/types/predictions';

/**
 * Prediction ticket type
 */
export interface PredictionTicket {
  id: string;
  userId: string;
  subscriptionId: string | null;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  usedAt: string | null;
  raceId: string | null;
  predictionId: string | null;
  issuedAt: string;
  expiresAt: string;
}

/**
 * Prediction ticket balance
 * Server fields: available, used, expired, total
 */
export interface TicketBalance {
  userId?: string;
  availableTickets?: number;
  available?: number;
  usedTickets?: number;
  used?: number;
  expiredTickets?: number;
  expired?: number;
  totalTickets?: number;
  total?: number;
}

/**
 * Prediction ticket usage result
 */
export interface UseTicketResult {
  prediction: PredictionResultDto;
  ticketUsed: boolean;
  ticket: {
    id: string;
    usedAt: string;
  } | null;
}

/**
 * Prediction ticket API
 */
export default class PredictionTicketsApi {
  /**
   * Use prediction ticket (request AI prediction)
   * @param regenerate - if true, ignore existing prediction and generate new AI prediction (re-predict)
   */
  static async redeem(
    raceId: string,
    options?: { regenerate?: boolean },
  ): Promise<UseTicketResult> {
    try {
      const response = await axiosInstance.post<ApiResponse<UseTicketResult>>(
        '/prediction-tickets/use',
        { raceId, regenerate: options?.regenerate ?? false },
        { timeout: 60000 },
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Get prediction ticket balance
   * Normalize server fields (available, used, expired, total) to availableTickets, etc.
   */
  static async getBalance(): Promise<TicketBalance> {
    try {
      const response = await axiosInstance.get('/prediction-tickets/balance');
      const d = handleApiResponse(response) as Record<string, number | undefined>;
      return {
        availableTickets: d?.available ?? d?.availableTickets ?? 0,
        usedTickets: d?.used ?? d?.usedTickets ?? 0,
        expiredTickets: d?.expired ?? d?.expiredTickets ?? 0,
        totalTickets: d?.total ?? d?.totalTickets ?? 0,
      } as TicketBalance;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Get usage history
   * Server response: { tickets, total, page, totalPages }
   */
  static async getHistory(
    limit = 50,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- API signature compatibility
    _offset = 0,
    page = 1,
  ): Promise<{ tickets: PredictionTicket[]; total: number; page: number; totalPages: number }> {
    try {
      const response = await axiosInstance.get('/prediction-tickets/history', {
        params: { limit, page },
      });
      const d = handleApiResponse(response) as {
        tickets?: PredictionTicket[];
        total?: number;
        page?: number;
        totalPages?: number;
      };
      return {
        tickets: d?.tickets ?? [],
        total: d?.total ?? 0,
        page: d?.page ?? 1,
        totalPages: d?.totalPages ?? 1,
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /** Check comprehensive prediction ticket access permission */
  static async checkMatrixAccess(date: string): Promise<{ hasAccess: boolean; expiresAt?: string }> {
    try {
      const response = await axiosInstance.get('/prediction-tickets/matrix/access', { params: { date } });
      return handleApiResponse(response);
    } catch {
      return { hasAccess: false };
    }
  }

  /** Use comprehensive prediction ticket */
  static async useMatrixTicket(date: string): Promise<{ ticket: PredictionTicket; alreadyUsed: boolean }> {
    try {
      const response = await axiosInstance.post('/prediction-tickets/matrix/use', { date });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /** Comprehensive prediction ticket balance */
  static async getMatrixBalance(): Promise<{ available: number; used: number; total: number }> {
    try {
      const response = await axiosInstance.get('/prediction-tickets/matrix/balance');
      const d = handleApiResponse(response) as { available?: number; used?: number; total?: number };
      return { available: d?.available ?? 0, used: d?.used ?? 0, total: d?.total ?? 0 };
    } catch {
      return { available: 0, used: 0, total: 0 };
    }
  }

  /** Purchase individual comprehensive prediction tickets */
  static async purchaseMatrixTickets(count: number = 1): Promise<{
    purchased: number;
    totalPrice: number;
    pricePerTicket: number;
    expiresAt: string;
  }> {
    try {
      const response = await axiosInstance.post('/prediction-tickets/matrix/purchase', { count });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /** Get comprehensive prediction ticket price */
  static async getMatrixPrice(): Promise<{ pricePerTicket: number; currency: string; maxPerPurchase: number }> {
    try {
      const response = await axiosInstance.get('/prediction-tickets/matrix/price');
      return handleApiResponse(response);
    } catch {
      return { pricePerTicket: 1000, currency: 'KRW', maxPerPurchase: 10 };
    }
  }

  /**
   * Get prediction ticket details
   */
  static async getById(id: string): Promise<PredictionTicket> {
    try {
      const response = await axiosInstance.get<ApiResponse<PredictionTicket>>(
        `/prediction-tickets/${id}`,
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}
