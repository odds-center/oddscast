import { ApiResponse } from '@/lib/types/api';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';
import CONFIG from '@/lib/config';
import { mockTicketBalance, mockPredictions } from '@/lib/mocks/data';
import type { PredictionResultDto } from '@/lib/types/predictions';

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
 * 서버 필드: available, used, expired, total
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
 * 예측권 사용 결과
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
 * 예측권 API
 */
export default class PredictionTicketsApi {
  /**
   * 예측권 사용 (AI 예측 요청)
   */
  static async use(raceId: string): Promise<UseTicketResult> {
    if (CONFIG.useMock) {
      const pred = mockPredictions.find((p: any) => p.raceId === raceId) ?? mockPredictions[0];
      return {
        prediction: pred as unknown as PredictionResultDto,
        ticketUsed: true,
        ticket: { id: 'mock-ticket', usedAt: new Date().toISOString() },
      };
    }
    try {
      const response = await axiosInstance.post<ApiResponse<UseTicketResult>>(
        '/prediction-tickets/use',
        { raceId },
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 예측권 잔액 조회
   * 서버 필드(available,used,expired,total)를 availableTickets 등으로 정규화
   */
  static async getBalance(): Promise<TicketBalance> {
    if (CONFIG.useMock) return mockTicketBalance;
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
   * 사용 내역 조회
   * 서버 응답: { tickets, total, page, totalPages }
   */
  static async getHistory(
    limit = 50,
    _offset = 0,
    page = 1,
  ): Promise<{ tickets: PredictionTicket[]; total: number; page: number; totalPages: number }> {
    if (CONFIG.useMock) {
      return { tickets: [], total: 0, page: 1, totalPages: 1 };
    }
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

  /**
   * 예측권 상세 조회
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
