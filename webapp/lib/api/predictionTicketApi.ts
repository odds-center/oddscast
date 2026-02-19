import { ApiResponse } from '@/lib/types/api';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/api/axios';
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
   * @param regenerate - true면 기존 예측 무시하고 새로 AI 예측 생성 (다시 예측)
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
   * 예측권 잔액 조회
   * 서버 필드(available,used,expired,total)를 availableTickets 등으로 정규화
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
   * 사용 내역 조회
   * 서버 응답: { tickets, total, page, totalPages }
   */
  static async getHistory(
    limit = 50,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- API 시그니처 호환
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

  /** 종합 예측권 접근 권한 확인 */
  static async checkMatrixAccess(date: string): Promise<{ hasAccess: boolean; expiresAt?: string }> {
    try {
      const response = await axiosInstance.get('/prediction-tickets/matrix/access', { params: { date } });
      return handleApiResponse(response);
    } catch {
      return { hasAccess: false };
    }
  }

  /** 종합 예측권 사용 */
  static async useMatrixTicket(date: string): Promise<{ ticket: PredictionTicket; alreadyUsed: boolean }> {
    try {
      const response = await axiosInstance.post('/prediction-tickets/matrix/use', { date });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /** 종합 예측권 잔액 */
  static async getMatrixBalance(): Promise<{ available: number; used: number; total: number }> {
    try {
      const response = await axiosInstance.get('/prediction-tickets/matrix/balance');
      const d = handleApiResponse(response) as { available?: number; used?: number; total?: number };
      return { available: d?.available ?? 0, used: d?.used ?? 0, total: d?.total ?? 0 };
    } catch {
      return { available: 0, used: 0, total: 0 };
    }
  }

  /** 종합 예측권 개별 구매 */
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

  /** 종합 예측권 가격 조회 */
  static async getMatrixPrice(): Promise<{ pricePerTicket: number; currency: string; maxPerPurchase: number }> {
    try {
      const response = await axiosInstance.get('/prediction-tickets/matrix/price');
      return handleApiResponse(response);
    } catch {
      return { pricePerTicket: 1000, currency: 'KRW', maxPerPurchase: 10 };
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
