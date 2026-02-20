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
  TicketUsageTrend,
  Revenue,
} from '../types/admin';

/**
 * Dashboard API
 */
export class AdminDashboardApi {
  static async getStats(): Promise<DashboardStats> {
    try {
      const response = await axiosInstance.get<DashboardStats>('/statistics/dashboard');
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
      const response = await axiosInstance.get<UserListResponse>('/users', { params });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getOne(id: string): Promise<User> {
    try {
      const response = await axiosInstance.get<User>(`/users/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async update(id: string, data: Partial<User>): Promise<User> {
    try {
      const response = await axiosInstance.patch<User>(`/users/${id}`, data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/users/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async activate(id: string): Promise<User> {
    try {
      const response = await axiosInstance.patch<User>(`/users/${id}/activate`, {});
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async deactivate(id: string): Promise<User> {
    try {
      const response = await axiosInstance.patch<User>(`/users/${id}/deactivate`, {});
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async grantTickets(
    id: string | number,
    count: number,
    expiresInDays?: number,
    type: 'RACE' | 'MATRIX' = 'RACE',
  ): Promise<{ granted: number; type: string; tickets: unknown[] }> {
    try {
      const response = await axiosInstance.post<{ granted: number; type: string; tickets: unknown[] }>(
        `/users/${id}/grant-tickets`,
        { count, expiresInDays, type },
      );
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
      const response = await axiosInstance.get<BetListResponse>('/bets', { params });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getOne(id: string): Promise<Bet> {
    try {
      const response = await axiosInstance.get<Bet>(`/bets/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateStatus(id: string, status: string): Promise<Bet> {
    try {
      const response = await axiosInstance.patch<Bet>(`/bets/${id}/status`, { status });
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
      const response = await axiosInstance.get<SubscriptionPlan[]>('/subscriptions/plans');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getPlan(planId: string): Promise<SubscriptionPlan> {
    try {
      const response = await axiosInstance.get<SubscriptionPlan>(
        `/subscriptions/plans/${planId}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    try {
      const response = await axiosInstance.post<SubscriptionPlan>(
        '/subscriptions/plans',
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
        `/subscriptions/plans/${planId}`,
        data
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async deletePlan(planId: string): Promise<SubscriptionPlan | { isActive: boolean }> {
    try {
      const response = await axiosInstance.delete<SubscriptionPlan | { isActive: boolean }>(
        `/subscriptions/plans/${planId}`
      );
      return handleApiResponse(response);
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
      const response = await axiosInstance.get('/subscriptions/users', { params });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getUserSubscription(userId: string): Promise<any> {
    try {
      const response = await axiosInstance.get(`/subscriptions/users/${userId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async cancelUserSubscription(userId: string, body: any): Promise<any> {
    try {
      const response = await axiosInstance.patch(
        `/subscriptions/users/${userId}/cancel`,
        body
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async extendUserSubscription(userId: string, days: number): Promise<any> {
    try {
      const response = await axiosInstance.patch(`/subscriptions/users/${userId}/extend`, {
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
        '/single-purchase/config'
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateConfig(data: Partial<SinglePurchaseConfig>): Promise<SinglePurchaseConfig> {
    try {
      const response = await axiosInstance.patch<SinglePurchaseConfig>(
        '/single-purchase/config',
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
      const response = await axiosInstance.get('/config/system');
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
      const response = await axiosInstance.patch('/config/system', data);
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
      const response = await axiosInstance.get('/ai/config');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateConfig(data: any): Promise<any> {
    try {
      const response = await axiosInstance.post('/ai/config', data);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async estimateCost(): Promise<any> {
    try {
      const response = await axiosInstance.get('/ai/estimate-cost');
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
  static async getStatus(): Promise<{ baseUrlInUse: string; serviceKeyConfigured: boolean }> {
    try {
      const response = await axiosInstance.get('/kra/status');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 경주계획표+출전표 동기화.
   * year 지정 시 해당 연도 전체(1~12월) 경주계획표만 적재(시행일 달력용).
   * date 지정 시 해당일 경주계획표→출전표. 둘 다 미지정 시 오늘~1년 내 금·토·일 전체.
   * @param params - { date?: string, year?: number } 또는 레거시로 date 문자열만 전달 가능
   */
  static async syncSchedule(params?: { date?: string; year?: number } | string): Promise<any> {
    try {
      const search = new URLSearchParams();
      const year = typeof params === 'object' && params?.year != null && !Number.isNaN(params.year) ? params.year : undefined;
      const date = typeof params === 'string' ? params : (typeof params === 'object' && params?.date ? params.date : undefined);
      if (year != null) search.set('year', String(year));
      else if (date) search.set('date', date);
      const url = search.toString() ? `/kra/sync/schedule?${search.toString()}` : '/kra/sync/schedule';
      const response = await axiosInstance.post(url, {}, { timeout: 600_000 });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async syncResults(date?: string): Promise<any> {
    try {
      const url = date ? `/kra/sync/results?date=${date}` : '/kra/sync/results';
      const response = await axiosInstance.post(url, {}, { timeout: 300_000 });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async syncDetails(date: string): Promise<any> {
    try {
      const response = await axiosInstance.post(`/kra/sync/details?date=${date}`, {}, { timeout: 120_000 });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async syncJockeys(meet?: string): Promise<any> {
    try {
      const url = meet ? `/kra/sync/jockeys?meet=${meet}` : '/kra/sync/jockeys';
      const response = await axiosInstance.post(url, {}, { timeout: 60_000 });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async syncAll(date?: string): Promise<{
    message: string;
    entrySheet?: { races: number; entries: number };
    results?: { totalResults: number };
  }> {
    try {
      const d = date?.replace(/-/g, '').slice(0, 8) ||
        new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const response = await axiosInstance.post(`/kra/sync/all?date=${d}`, {}, { timeout: 300_000 });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async syncHistorical(dateFrom: string, dateTo: string): Promise<any> {
    try {
      // 과거 적재는 여러 날짜 순회로 수 분 소요 가능 → 5분 timeout
      const response = await axiosInstance.post(
        `/kra/sync/historical?dateFrom=${dateFrom}&dateTo=${dateTo}`,
        {},
        { timeout: 300_000 }
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async seedSample(date?: string): Promise<{ races: number; entries: number; rcDate: string }> {
    try {
      const url = date ? `/kra/seed-sample?date=${date}` : '/kra/seed-sample';
      const response = await axiosInstance.post(url);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getSyncLogs(params?: {
    endpoint?: string;
    rcDate?: string;
    limit?: number;
  }): Promise<{ logs: Array<{
    id: number;
    endpoint: string;
    meet: string | null;
    rcDate: string | null;
    status: string;
    recordCount: number;
    errorMessage: string | null;
    durationMs: number | null;
    createdAt: string;
  }>; total: number }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.endpoint) searchParams.set('endpoint', params.endpoint);
      if (params?.rcDate) searchParams.set('rcDate', params.rcDate);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();
      const response = await axiosInstance.get(`/kra/sync-logs${qs ? `?${qs}` : ''}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

/**
 * Races API — Server /api/admin/races 사용
 */
export class AdminRacesApi {
  static async getAll(params?: {
    page?: number;
    limit?: number;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    meet?: string;
  }): Promise<{
    data: unknown[];
    meta: { totalPages: number };
  }> {
    try {
      const response = await axiosInstance.get<{
        data?: { races?: unknown[]; totalPages?: number };
      }>('/races', { params });
      const body = response.data;
      const payload = body?.data ?? body;
      return {
        data: Array.isArray((payload as { races?: unknown[] })?.races)
          ? (payload as { races: unknown[] }).races
          : [],
        meta: {
          totalPages: (payload as { totalPages?: number })?.totalPages ?? 1,
        },
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getOne(id: string): Promise<unknown> {
    try {
      const response = await axiosInstance.get(`/races/${id}`);
      const body = response.data as { data?: unknown } | unknown;
      return body && typeof body === 'object' && 'data' in body
        ? (body as { data: unknown }).data
        : body;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async update(
    id: string,
    data: Record<string, unknown>
  ): Promise<unknown> {
    try {
      const response = await axiosInstance.patch<{ data?: unknown }>(
        `/races/${id}`,
        data
      );
      const body = response.data;
      return body && typeof body === 'object' && 'data' in body
        ? (body as { data: unknown }).data
        : body;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

/**
 * Results API — Server /api/results 사용
 */
export class AdminResultsApi {
  static async getAll(params?: {
    page?: number;
    limit?: number;
    date?: string;
    meet?: string;
  }): Promise<any> {
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
    rcTime?: string;
    chaksun1?: number;
  }): Promise<any> {
    try {
      const response = await axiosInstance.post('/results', dto);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async update(id: string, dto: { ord?: string; rcTime?: string; chaksun1?: number }): Promise<any> {
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
      const response = await axiosInstance.get('/notifications', { params });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async send(data: { title: string; message: string; target: string }): Promise<any> {
    try {
      const response = await axiosInstance.post('/notifications/send', data);
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
      const response = await axiosInstance.get<RevenueStats[]>('/statistics/revenue', {
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
      const response = await axiosInstance.get('/statistics/dashboard');
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getUsersGrowth(days?: number): Promise<UsersGrowth[]> {
    try {
      const response = await axiosInstance.get<UsersGrowth[]>('/statistics/users-growth', {
        params: { days },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getTicketUsageTrend(days?: number): Promise<TicketUsageTrend[]> {
    try {
      const response = await axiosInstance.get<TicketUsageTrend[]>(
        '/statistics/ticket-usage-trend',
        { params: { days } }
      );
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
    subscriptionByPlan: Array<{ planName: string; count: number; revenue: number }>;
    singlePurchaseCount: number;
    rows: Revenue[];
  }> {
    try {
      const response = await axiosInstance.get('/statistics/revenue', {
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
