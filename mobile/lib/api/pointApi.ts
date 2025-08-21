import { ApiResponse } from '@/lib/types/api';
import {
  CreatePointRequest,
  PointAdjustmentRequest,
  PointAuditLog,
  PointExpiryNotification,
  PointExpirySettings,
  PointListResponse,
  PointPromotion,
  PointReport,
  PointSearchFilters,
  PointSettings,
  PointStatistics,
  PointTransactionFilters,
  PointTransferRequest,
  PointTransferResponse,
  UpdatePointRequest,
  UserPointBalance,
  UserPoints,
} from '@/lib/types/point';
import { apiClient, handleApiError, handleApiResponse } from '@/lib/utils/axios';
import qs from 'qs';

export class PointApi {
  private static instance: PointApi;
  private baseUrl = '/points';

  private constructor() {}

  public static getInstance(): PointApi {
    if (!PointApi.instance) {
      PointApi.instance = new PointApi();
    }
    return PointApi.instance;
  }

  // 정적 메서드들
  static async getUserPointBalance(userId: string): Promise<UserPointBalance> {
    try {
      const response = await apiClient.get<ApiResponse<UserPointBalance>>(
        `/points/${userId}/balance`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getPointTransactions(
    userId: string,
    filters?: PointTransactionFilters
  ): Promise<PointListResponse> {
    try {
      const queryString = qs.stringify(filters, {
        skipNulls: true,
        arrayFormat: 'brackets',
        addQueryPrefix: true,
      });

      const response = await apiClient.get<ApiResponse<PointListResponse>>(
        `/points/${userId}/transactions${queryString}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async createPointTransaction(
    userId: string,
    transactionData: CreatePointRequest
  ): Promise<UserPoints> {
    try {
      const response = await apiClient.post<ApiResponse<UserPoints>>(
        `/points/${userId}/transactions`,
        transactionData
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updatePointTransaction(
    transactionId: string,
    updateData: UpdatePointRequest
  ): Promise<UserPoints> {
    try {
      const response = await apiClient.put<ApiResponse<UserPoints>>(
        `/points/transactions/${transactionId}`,
        updateData
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getPointStatistics(userId: string): Promise<PointStatistics> {
    try {
      const response = await apiClient.get<ApiResponse<PointStatistics>>(
        `/points/${userId}/statistics`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async transferPoints(transferData: PointTransferRequest): Promise<PointTransferResponse> {
    try {
      const response = await apiClient.post<ApiResponse<PointTransferResponse>>(
        '/points/transfer',
        transferData
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getPointPromotions(filters?: {
    isActive?: boolean;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PointPromotion[]> {
    try {
      const queryString = qs.stringify(filters, {
        skipNulls: true,
        addQueryPrefix: true,
      });

      const response = await apiClient.get<ApiResponse<PointPromotion[]>>(
        `/points/promotions${queryString}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async applyPointPromotion(
    userId: string,
    promotionId: string
  ): Promise<{ message: string; pointsEarned: number }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string; pointsEarned: number }>>(
        `/points/${userId}/promotions/${promotionId}/apply`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getExpiringPoints(userId: string): Promise<PointExpiryNotification[]> {
    try {
      const response = await apiClient.get<ApiResponse<PointExpiryNotification[]>>(
        `/points/${userId}/expiring`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async extendPointExpiry(
    transactionId: string,
    extensionDays: number
  ): Promise<{ message: string; newExpiryDate: string }> {
    try {
      const response = await apiClient.post<
        ApiResponse<{ message: string; newExpiryDate: string }>
      >(`/points/transactions/${transactionId}/extend`, { extensionDays });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getPointAuditLog(
    userId: string,
    filters?: { dateFrom?: string; dateTo?: string; page?: number; limit?: number }
  ): Promise<{ logs: PointAuditLog[]; total: number; page: number; totalPages: number }> {
    try {
      const queryString = qs.stringify(filters, {
        skipNulls: true,
        addQueryPrefix: true,
      });

      const response = await apiClient.get<
        ApiResponse<{
          logs: PointAuditLog[];
          total: number;
          page: number;
          totalPages: number;
        }>
      >(`/points/${userId}/audit-log${queryString}`);

      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getPointSettings(): Promise<PointSettings[]> {
    try {
      const response = await apiClient.get<ApiResponse<PointSettings[]>>('/points/settings');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updatePointSettings(settingId: string, value: string): Promise<PointSettings> {
    try {
      const response = await apiClient.put<ApiResponse<PointSettings>>(
        `/points/settings/${settingId}`,
        { value }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async generatePointReport(filters?: {
    dateFrom?: string;
    dateTo?: string;
    userId?: string;
  }): Promise<PointReport> {
    try {
      const queryString = qs.stringify(filters, {
        skipNulls: true,
        addQueryPrefix: true,
      });

      const response = await apiClient.get<ApiResponse<PointReport>>(
        `/points/reports${queryString}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async searchPointTransactions(
    userId: string,
    query: string,
    filters?: PointSearchFilters
  ): Promise<PointListResponse> {
    try {
      const searchParams = { q: query, ...filters };
      const queryString = qs.stringify(searchParams, {
        skipNulls: true,
        arrayFormat: 'brackets',
        addQueryPrefix: true,
      });

      const response = await apiClient.get<ApiResponse<PointListResponse>>(
        `/points/${userId}/transactions/search${queryString}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async adjustPointBalance(
    userId: string,
    adjustmentData: PointAdjustmentRequest
  ): Promise<{ message: string; newBalance: number }> {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string; newBalance: number }>>(
        `/points/${userId}/adjust`,
        adjustmentData
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getPointExpirySettings(): Promise<PointExpirySettings> {
    try {
      const response = await apiClient.get<ApiResponse<PointExpirySettings>>(
        '/points/expiry-settings'
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 인스턴스 메서드들 (기존 호환성 유지)
  async getUserPointBalanceInstance(userId: string): Promise<UserPointBalance> {
    return PointApi.getUserPointBalance(userId);
  }

  async getPointTransactionsInstance(
    userId: string,
    filters?: PointTransactionFilters
  ): Promise<PointListResponse> {
    return PointApi.getPointTransactions(userId, filters);
  }

  async createPointTransactionInstance(
    userId: string,
    transactionData: CreatePointRequest
  ): Promise<UserPoints> {
    return PointApi.createPointTransaction(userId, transactionData);
  }

  async updatePointTransactionInstance(
    transactionId: string,
    updateData: UpdatePointRequest
  ): Promise<UserPoints> {
    return PointApi.updatePointTransaction(transactionId, updateData);
  }

  async getPointStatisticsInstance(userId: string): Promise<PointStatistics> {
    return PointApi.getPointStatistics(userId);
  }

  async transferPointsInstance(transferData: PointTransferRequest): Promise<PointTransferResponse> {
    return PointApi.transferPoints(transferData);
  }

  async getPointPromotionsInstance(filters?: {
    isActive?: boolean;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PointPromotion[]> {
    return PointApi.getPointPromotions(filters);
  }

  async applyPointPromotionInstance(
    userId: string,
    promotionId: string
  ): Promise<{ message: string; pointsEarned: number }> {
    return PointApi.applyPointPromotion(userId, promotionId);
  }

  async getExpiringPointsInstance(userId: string): Promise<PointExpiryNotification[]> {
    return PointApi.getExpiringPoints(userId);
  }

  async extendPointExpiryInstance(
    transactionId: string,
    extensionDays: number
  ): Promise<{ message: string; newExpiryDate: string }> {
    return PointApi.extendPointExpiry(transactionId, extensionDays);
  }

  async getPointAuditLogInstance(
    userId: string,
    filters?: { dateFrom?: string; dateTo?: string; page?: number; limit?: number }
  ): Promise<{ logs: PointAuditLog[]; total: number; page: number; totalPages: number }> {
    return PointApi.getPointAuditLog(userId, filters);
  }

  async getPointSettingsInstance(): Promise<PointSettings[]> {
    return PointApi.getPointSettings();
  }

  async updatePointSettingsInstance(settingId: string, value: string): Promise<PointSettings> {
    return PointApi.updatePointSettings(settingId, value);
  }

  async generatePointReportInstance(filters?: {
    dateFrom?: string;
    dateTo?: string;
    userId?: string;
  }): Promise<PointReport> {
    return PointApi.generatePointReport(filters);
  }

  async searchPointTransactionsInstance(
    userId: string,
    query: string,
    filters?: PointSearchFilters
  ): Promise<PointListResponse> {
    return PointApi.searchPointTransactions(userId, query, filters);
  }

  async adjustPointBalanceInstance(
    userId: string,
    adjustmentData: PointAdjustmentRequest
  ): Promise<{ message: string; newBalance: number }> {
    return PointApi.adjustPointBalance(userId, adjustmentData);
  }

  async getPointExpirySettingsInstance(): Promise<PointExpirySettings> {
    return PointApi.getPointExpirySettings();
  }
}

// 싱글톤 인스턴스 export (기존 호환성 유지)
export const pointApi = PointApi.getInstance();
