import { ApiResponse } from '@/lib/types/api';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/utils/axios';
import type { PredictionResult } from './predictions';

/**
 * 예측권 타입
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
 * 예측권 잔액
 */
export interface TicketBalance {
  userId: string;
  availableTickets: number;
  usedTickets: number;
  expiredTickets: number;
  totalTickets: number;
}

/**
 * 예측권 사용 결과
 */
export interface UseTicketResult {
  prediction: PredictionResult;
  ticketUsed: boolean;
  ticket: {
    id: string;
    usedAt: string;
  } | null;
}

/**
 * 예측권 API
 */
export class PredictionTicketsApi {
  /**
   * 예측권 사용 (AI 예측 요청)
   */
  static async use(raceId: string): Promise<UseTicketResult> {
    try {
      const response = await axiosInstance.post<ApiResponse<UseTicketResult>>(
        '/prediction-tickets/use',
        { raceId }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 예측권 잔액 조회
   */
  static async getBalance(): Promise<TicketBalance> {
    try {
      const response = await axiosInstance.get<ApiResponse<TicketBalance>>(
        '/prediction-tickets/balance'
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 사용 내역 조회
   */
  static async getHistory(limit = 50, offset = 0): Promise<PredictionTicket[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<PredictionTicket[]>>(
        '/prediction-tickets/history',
        { params: { limit, offset } }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 예측권 상세 조회
   */
  static async getById(id: string): Promise<PredictionTicket> {
    try {
      const response = await axiosInstance.get<ApiResponse<PredictionTicket>>(
        `/prediction-tickets/${id}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

// 기본 export
export const predictionTicketsApi = PredictionTicketsApi;
