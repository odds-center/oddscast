import { ApiResponse } from '@/lib/types/api';
import type {
  Bet,
  BetAnalysis,
  BetFilters,
  BetHistory,
  BetResult,
  BetSlip,
  BetStatistics,
  BetType,
  CreateBetRequest,
  UpdateBetRequest,
} from '@/lib/types/bet';
import { apiClient, handleApiError, handleApiResponse } from '@/lib/utils/axios';
import qs from 'qs';

// 베팅 API 클래스
export class BetApi {
  private static instance: BetApi;
  private baseUrl = '/bets';

  private constructor() {}

  public static getInstance(): BetApi {
    if (!BetApi.instance) {
      BetApi.instance = new BetApi();
    }
    return BetApi.instance;
  }

  // 정적 메서드들 - 인스턴스 생성 없이 직접 사용 가능
  static async createBet(betData: CreateBetRequest): Promise<Bet> {
    try {
      const response = await apiClient.post<ApiResponse<Bet>>('/bets', betData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getBet(betId: string): Promise<Bet> {
    try {
      const response = await apiClient.get<ApiResponse<Bet>>(`/bets/${betId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getBets(filters?: BetFilters): Promise<{
    bets: Bet[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const queryString = qs.stringify(filters, {
        skipNulls: true,
        arrayFormat: 'brackets',
      });

      const response = await apiClient.get<
        ApiResponse<{
          bets: Bet[];
          total: number;
          page: number;
          totalPages: number;
        }>
      >(`/bets?${queryString}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateBet(betId: string, updateData: UpdateBetRequest): Promise<Bet> {
    try {
      const response = await apiClient.put<ApiResponse<Bet>>(`/bets/${betId}`, updateData);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async deleteBet(betId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/bets/${betId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async cancelBet(betId: string): Promise<Bet> {
    try {
      const response = await apiClient.patch<ApiResponse<Bet>>(`/bets/${betId}/cancel`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async processBetResult(
    betId: string,
    result: BetResult,
    actualWin?: number
  ): Promise<Bet> {
    try {
      const response = await apiClient.patch<ApiResponse<Bet>>(`/bets/${betId}/result`, {
        result,
        actualWin,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getBetStatistics(filters?: {
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    betType?: BetType;
  }): Promise<BetStatistics> {
    try {
      const queryString = qs.stringify(filters, {
        skipNulls: true,
        arrayFormat: 'brackets',
      });

      const response = await apiClient.get<ApiResponse<BetStatistics>>(
        `/bets/statistics?${queryString}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getBetAnalysis(betId: string): Promise<BetAnalysis> {
    try {
      const response = await apiClient.get<ApiResponse<BetAnalysis>>(`/bets/${betId}/analysis`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async createBetSlip(
    raceId: string,
    bets: Array<{
      betType: BetType;
      amount: number;
      selections: string[];
    }>
  ): Promise<BetSlip> {
    try {
      const response = await apiClient.post<ApiResponse<BetSlip>>(`/bets/slip`, {
        raceId,
        bets,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async confirmBetSlip(slipId: string): Promise<{ message: string; bets: Bet[] }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string; bets: Bet[] }>>(
        `/bets/slip/${slipId}/confirm`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getBetHistory(filters?: BetFilters): Promise<BetHistory> {
    try {
      const queryString = qs.stringify(filters, {
        skipNulls: true,
        arrayFormat: 'brackets',
      });

      const response = await apiClient.get<ApiResponse<BetHistory>>(`/bets/history?${queryString}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async searchBets(
    query: string,
    filters?: Omit<BetFilters, 'userId'>
  ): Promise<{
    bets: Bet[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const searchParams = { query, ...filters };
      const queryString = qs.stringify(searchParams, {
        skipNulls: true,
        arrayFormat: 'brackets',
      });

      const response = await apiClient.get<
        ApiResponse<{
          bets: Bet[];
          total: number;
          page: number;
          totalPages: number;
        }>
      >(`/bets/search?${queryString}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async exportBets(filters?: BetFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    try {
      const exportParams = { ...filters, format };
      const queryString = qs.stringify(exportParams, {
        skipNulls: true,
        arrayFormat: 'brackets',
      });

      const response = await apiClient.get(`/bets/export?${queryString}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 인스턴스 메서드들 (기존 호환성 유지)
  async createBetInstance(betData: CreateBetRequest): Promise<Bet> {
    return BetApi.createBet(betData);
  }

  async getBetInstance(betId: string): Promise<Bet> {
    return BetApi.getBet(betId);
  }

  async getBetsInstance(filters?: BetFilters): Promise<{
    bets: Bet[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return BetApi.getBets(filters);
  }

  async updateBetInstance(betId: string, updateData: UpdateBetRequest): Promise<Bet> {
    return BetApi.updateBet(betId, updateData);
  }

  async deleteBetInstance(betId: string): Promise<{ message: string }> {
    return BetApi.deleteBet(betId);
  }

  async cancelBetInstance(betId: string): Promise<Bet> {
    return BetApi.cancelBet(betId);
  }

  async processBetResultInstance(
    betId: string,
    result: BetResult,
    actualWin?: number
  ): Promise<Bet> {
    return BetApi.processBetResult(betId, result, actualWin);
  }

  async getBetStatisticsInstance(filters?: {
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    betType?: BetType;
  }): Promise<BetStatistics> {
    return BetApi.getBetStatistics(filters);
  }

  async getBetAnalysisInstance(betId: string): Promise<BetAnalysis> {
    return BetApi.getBetAnalysis(betId);
  }

  async createBetSlipInstance(
    raceId: string,
    bets: Array<{
      betType: BetType;
      amount: number;
      selections: string[];
    }>
  ): Promise<BetSlip> {
    return BetApi.createBetSlip(raceId, bets);
  }

  async confirmBetSlipInstance(slipId: string): Promise<{ message: string; bets: Bet[] }> {
    return BetApi.confirmBetSlip(slipId);
  }

  async getBetHistoryInstance(filters?: BetFilters): Promise<BetHistory> {
    return BetApi.getBetHistory(filters);
  }

  async searchBetsInstance(
    query: string,
    filters?: Omit<BetFilters, 'userId'>
  ): Promise<{
    bets: Bet[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return BetApi.searchBets(query, filters);
  }

  async exportBetsInstance(filters?: BetFilters, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    return BetApi.exportBets(filters, format);
  }
}

// 싱글톤 인스턴스 export (기존 호환성 유지)
export const betApi = BetApi.getInstance();
