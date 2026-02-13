/**
 * Admin API 클라이언트 (Mobile 패턴 적용)
 */
import { axiosInstance, handleApiResponse, handleApiError } from '../utils/axios';
import type {
  DashboardStats,
  UserListResponse,
  User,
  BetListResponse,
  Bet,
  SubscriptionPlan,
  SinglePurchaseConfig,
  AIAccuracyDashboard,
  AIDailyStats,
  AIFailureAnalysis,
  RevenueStats,
  UsersGrowth,
  BetsTrend,
  Revenue,
} from '../types/admin';

/**
 * Dashboard API
 */
export class AdminDashboardApi {
  static async getStats(): Promise<DashboardStats> {
    try {
      const response = await axiosInstance.get<DashboardStats>('/admin/statistics/dashboard');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

/**
 * Users API
 */
export class AdminUsersApi {
  static async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<UserListResponse> {
    try {
      const response = await axiosInstance.get<UserListResponse>('/admin/users', { params });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getOne(id: string): Promise<User> {
    try {
      const response = await axiosInstance.get<User>(`/admin/users/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async update(id: string, data: Partial<User>): Promise<User> {
    try {
      const response = await axiosInstance.patch<User>(`/admin/users/${id}`, data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/admin/users/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async activate(id: string): Promise<User> {
    try {
      const response = await axiosInstance.patch<User>(`/admin/users/${id}/activate`, {});
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async deactivate(id: string): Promise<User> {
    try {
      const response = await axiosInstance.patch<User>(`/admin/users/${id}/deactivate`, {});
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

/**
 * Bets API
 */
export class AdminBetsApi {
  static async getAll(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    raceId?: string;
    status?: string;
  }): Promise<BetListResponse> {
    try {
      const response = await axiosInstance.get<BetListResponse>('/admin/bets', { params });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getOne(id: string): Promise<Bet> {
    try {
      const response = await axiosInstance.get<Bet>(`/admin/bets/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateStatus(id: string, status: string): Promise<Bet> {
    try {
      const response = await axiosInstance.patch<Bet>(`/admin/bets/${id}/status`, { status });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

/**
 * Subscriptions API
 */
export class AdminSubscriptionsApi {
  // 플랜 관리
  static async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await axiosInstance.get<SubscriptionPlan[]>('/admin/subscriptions/plans');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getPlan(planId: string): Promise<SubscriptionPlan> {
    try {
      const response = await axiosInstance.get<SubscriptionPlan>(
        `/admin/subscriptions/plans/${planId}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    try {
      const response = await axiosInstance.post<SubscriptionPlan>(
        '/admin/subscriptions/plans',
        data
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updatePlan(
    planId: string,
    data: Partial<SubscriptionPlan>
  ): Promise<SubscriptionPlan> {
    try {
      const response = await axiosInstance.patch<SubscriptionPlan>(
        `/admin/subscriptions/plans/${planId}`,
        data
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async deletePlan(planId: string): Promise<void> {
    try {
      await axiosInstance.delete(`/admin/subscriptions/plans/${planId}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 사용자 구독 관리
  static async getUserSubscriptions(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<any> {
    try {
      const response = await axiosInstance.get('/admin/subscriptions/users', { params });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getUserSubscription(userId: string): Promise<any> {
    try {
      const response = await axiosInstance.get(`/admin/subscriptions/users/${userId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async cancelUserSubscription(userId: string, body: any): Promise<any> {
    try {
      const response = await axiosInstance.patch(
        `/admin/subscriptions/users/${userId}/cancel`,
        body
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async extendUserSubscription(userId: string, days: number): Promise<any> {
    try {
      const response = await axiosInstance.patch(`/admin/subscriptions/users/${userId}/extend`, {
        days,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

/**
 * Single Purchase API
 */
export class AdminSinglePurchaseApi {
  static async getConfig(): Promise<SinglePurchaseConfig> {
    try {
      const response = await axiosInstance.get<SinglePurchaseConfig>(
        '/admin/single-purchase/config'
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateConfig(data: Partial<SinglePurchaseConfig>): Promise<SinglePurchaseConfig> {
    try {
      const response = await axiosInstance.patch<SinglePurchaseConfig>(
        '/admin/single-purchase/config',
        data
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async calculatePrice(quantity: number): Promise<{ totalPrice: number }> {
    try {
      const response = await axiosInstance.get<{ totalPrice: number }>(
        '/single-purchases/calculate-price',
        { params: { quantity } }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

/**
 * AI Predictions API
 */
export class AdminAIApi {
  static async getAccuracyDashboard(): Promise<AIAccuracyDashboard> {
    try {
      const response = await axiosInstance.get<AIAccuracyDashboard>(
        '/predictions/analytics/dashboard'
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async calculateDailyStats(date?: string): Promise<AIDailyStats> {
    try {
      const response = await axiosInstance.post<AIDailyStats>(
        '/predictions/analytics/daily-stats',
        {
          date,
        }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async analyzeFailures(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<AIFailureAnalysis> {
    try {
      const response = await axiosInstance.get<AIFailureAnalysis>(
        '/predictions/analytics/failures',
        { params }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getAccuracy(): Promise<{ averageAccuracy: number }> {
    try {
      const response = await axiosInstance.get<{ averageAccuracy: number }>(
        '/predictions/stats/accuracy'
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getCost(): Promise<{ totalCost: number }> {
    try {
      const response = await axiosInstance.get<{ totalCost: number }>('/predictions/stats/cost');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

/**
 * System Config API
 */
export class AdminSystemConfigApi {
  static async getConfig(): Promise<{
    show_google_login: boolean;
    kra_base_url_override: string;
  }> {
    try {
      const response = await axiosInstance.get('/admin/config/system');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateConfig(data: {
    show_google_login?: boolean;
    kra_base_url_override?: string;
  }): Promise<any> {
    try {
      const response = await axiosInstance.patch('/admin/config/system', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

/**
 * AI Config API
 */
export class AdminAIConfigApi {
  static async getConfig(): Promise<any> {
    try {
      const response = await axiosInstance.get('/admin/ai/config');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateConfig(data: any): Promise<any> {
    try {
      const response = await axiosInstance.post('/admin/ai/config', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async estimateCost(): Promise<any> {
    try {
      const response = await axiosInstance.get('/admin/ai/estimate-cost');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

/**
 * KRA 동기화 API
 */
export class AdminKraApi {
  static async syncSchedule(date: string): Promise<any> {
    try {
      const response = await axiosInstance.post(`/admin/kra/sync/schedule?date=${date}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async syncResults(date: string): Promise<any> {
    try {
      const response = await axiosInstance.post(`/admin/kra/sync/results?date=${date}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async syncDetails(date: string): Promise<any> {
    try {
      const response = await axiosInstance.post(`/admin/kra/sync/details?date=${date}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async syncJockeys(meet?: string): Promise<any> {
    try {
      const url = meet ? `/admin/kra/sync/jockeys?meet=${meet}` : '/admin/kra/sync/jockeys';
      const response = await axiosInstance.post(url);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async syncHistorical(dateFrom: string, dateTo: string): Promise<any> {
    try {
      const response = await axiosInstance.post(
        `/admin/kra/sync/historical?dateFrom=${dateFrom}&dateTo=${dateTo}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

/**
 * Races API — Server /api/races 사용
 */
export class AdminRacesApi {
  static async getAll(params?: { page?: number; limit?: number }): Promise<any> {
    try {
      const response = await axiosInstance.get<{ data: { races: any[]; total: number; page: number; totalPages: number } }>(
        '/races',
        { params }
      );
      const body = response.data as any;
      const payload = body?.data ?? body;
      return {
        data: payload?.races ?? [],
        meta: { totalPages: payload?.totalPages ?? 1 },
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getOne(id: string): Promise<any> {
    try {
      const response = await axiosInstance.get(`/races/${id}`);
      const body = response.data as any;
      return body?.data ?? body;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

/**
 * Results API — Server /api/results 사용
 */
export class AdminResultsApi {
  static async getAll(params?: { page?: number; limit?: number; date?: string }): Promise<any> {
    try {
      const response = await axiosInstance.get('/results', { params });
      const payload = handleApiResponse(response) as any;
      const results = payload?.results ?? payload?.data ?? [];
      return {
        data: Array.isArray(results) ? results : [],
        meta: {
          total: payload?.total ?? 0,
          totalPages: payload?.totalPages ?? 1,
          page: payload?.page ?? 1,
        },
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getOne(id: string): Promise<any> {
    try {
      const response = await axiosInstance.get(`/results/${id}`);
      const data = handleApiResponse(response);
      return (data as any)?.data ?? data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async create(dto: {
    raceId: string;
    hrNo: string;
    hrName: string;
    ord?: string;
    jkName?: string;
    trName?: string;
    owName?: string;
    rcRank?: string;
    rcTime?: string;
    rcPrize?: number;
  }): Promise<any> {
    try {
      const response = await axiosInstance.post('/results', dto);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async update(id: string, dto: { rcRank?: string; rcTime?: string; rcPrize?: number }): Promise<any> {
    try {
      const response = await axiosInstance.put(`/results/${id}`, dto);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/results/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

/**
 * Notifications API
 */
export class AdminNotificationsApi {
  static async getAll(params?: { page?: number; limit?: number }): Promise<any> {
    try {
      const response = await axiosInstance.get('/admin/notifications', { params });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async send(data: { title: string; message: string; target: string }): Promise<any> {
    try {
      const response = await axiosInstance.post('/admin/notifications/send', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

/**
 * Revenue API
 */
export class AdminRevenueApi {
  static async getStats(params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<RevenueStats[]> {
    try {
      const response = await axiosInstance.get<RevenueStats[]>('/admin/statistics/revenue', {
        params,
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

/**
 * Statistics API
 */
export class AdminStatisticsApi {
  static async getDashboard(): Promise<any> {
    try {
      const response = await axiosInstance.get('/admin/statistics/dashboard');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getUsersGrowth(days?: number): Promise<UsersGrowth[]> {
    try {
      const response = await axiosInstance.get<UsersGrowth[]>('/admin/statistics/users-growth', {
        params: { days },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getBetsTrend(days?: number): Promise<BetsTrend[]> {
    try {
      const response = await axiosInstance.get<BetsTrend[]>('/admin/statistics/bets-trend', {
        params: { days },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRevenue(period?: string): Promise<{
    monthlyRevenue: number;
    singleRevenue: number;
    totalRevenue: number;
    monthlyCost: number;
    monthlyProfit: number;
    margin: number;
    activeSubscribers: number;
    avgRevenuePerUser: number;
    rows: Revenue[];
  }> {
    try {
      const response = await axiosInstance.get('/admin/statistics/revenue', {
        params: { period },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

// Export instances (기존 호환성 유지)
export const adminDashboardApi = AdminDashboardApi;
export const adminUsersApi = AdminUsersApi;
export const adminBetsApi = AdminBetsApi;
export const adminSubscriptionsApi = AdminSubscriptionsApi;
export const adminSinglePurchaseApi = AdminSinglePurchaseApi;
export const adminAIApi = AdminAIApi;
export const adminSystemConfigApi = AdminSystemConfigApi;
export const adminAIConfigApi = AdminAIConfigApi;
export const adminKraApi = AdminKraApi;
export const adminRacesApi = AdminRacesApi;
export const adminResultsApi = AdminResultsApi;
export const adminNotificationsApi = AdminNotificationsApi;
export const adminRevenueApi = AdminRevenueApi;
export const adminStatisticsApi = AdminStatisticsApi;
