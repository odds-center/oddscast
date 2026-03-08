/**
 * Admin API 클라이언트 (Mobile 패턴 적용)
 */
import { axiosInstance, handleApiResponse, handleApiError } from '../utils/axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const KST = 'Asia/Seoul';

import type {
  DashboardStats,
  UserListResponse,
  User,
  SubscriptionPlan,
  SinglePurchaseConfig,
  UserSubscription,
  CancelUserSubscriptionBody,
  AIConfigUpdate,
  AdminListResponse,
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
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getOne(id: string): Promise<User> {
    try {
      const response = await axiosInstance.get<User>(`/users/${id}`);
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async update(id: string, data: Partial<User>): Promise<User> {
    try {
      const response = await axiosInstance.patch<User>(`/users/${id}`, data);
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/users/${id}`);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async activate(id: string): Promise<User> {
    try {
      const response = await axiosInstance.patch<User>(`/users/${id}/activate`, {});
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async deactivate(id: string): Promise<User> {
    try {
      const response = await axiosInstance.patch<User>(`/users/${id}/deactivate`, {});
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getPlan(planId: string): Promise<SubscriptionPlan> {
    try {
      const response = await axiosInstance.get<SubscriptionPlan>(
        `/subscriptions/plans/${planId}`
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async createPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    try {
      const response = await axiosInstance.post<SubscriptionPlan>(
        '/subscriptions/plans',
        data
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async deletePlan(planId: string): Promise<SubscriptionPlan | { isActive: boolean }> {
    try {
      const response = await axiosInstance.delete<SubscriptionPlan | { isActive: boolean }>(
        `/subscriptions/plans/${planId}`
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  // 사용자 구독 관리 — 서버에 해당 라우트 없음 (404). 필요 시 서버에 추가.
  static async getUserSubscriptions(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<any> {
    try {
      const response = await axiosInstance.get('/subscriptions/users', { params });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getUserSubscription(userId: string): Promise<UserSubscription | unknown> {
    try {
      const response = await axiosInstance.get(`/subscriptions/users/${userId}`);
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async cancelUserSubscription(
    userId: string,
    body: CancelUserSubscriptionBody
  ): Promise<unknown> {
    try {
      const response = await axiosInstance.patch(
        `/subscriptions/users/${userId}/cancel`,
        body
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async extendUserSubscription(userId: string, days: number): Promise<unknown> {
    try {
      const response = await axiosInstance.patch(`/subscriptions/users/${userId}/extend`, {
        days,
      });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async updateConfig(data: Partial<SinglePurchaseConfig>): Promise<SinglePurchaseConfig> {
    try {
      const response = await axiosInstance.patch<SinglePurchaseConfig>(
        '/single-purchase/config',
        data
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /** Server: GET /api/admin/single-purchase/calculate-price */
  static async calculatePrice(quantity: number): Promise<{ totalPrice: number }> {
    try {
      const response = await axiosInstance.get<{ totalPrice: number }>(
        '/single-purchase/calculate-price',
        { params: { quantity } }
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getAccuracy(): Promise<{ averageAccuracy: number }> {
    try {
      const response = await axiosInstance.get<{ averageAccuracy: number }>(
        '/predictions/stats/accuracy'
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getCost(): Promise<{ totalCost: number }> {
    try {
      const response = await axiosInstance.get<{ totalCost: number }>('/predictions/stats/cost');
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /** [Admin] 오늘 생성된 예측 건수 (KST) */
  static async getPredictionsTodayCount(): Promise<{ count: number }> {
    try {
      const response = await axiosInstance.get<{ count: number }>('/predictions/stats/today');
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /** [Admin] 전체 예측 목록 (페이지네이션, 최대 100건/페이지) */
  static async getPredictionsList(params?: {
    page?: number;
    limit?: number;
    status?: string;
    raceId?: number;
  }): Promise<{
    predictions: Array<{
      id: number;
      raceId: number;
      status: string;
      accuracy: number | null;
      createdAt: string;
      race: {
        id: number;
        rcDate: string;
        rcNo: string;
        meet: string;
        meetName: string | null;
        rcName: string | null;
        status: string;
      };
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await axiosInstance.get('/predictions/list', { params });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /** [Admin] 경주별 예측 이력 전체 */
  static async getPredictionHistoryByRace(raceId: number): Promise<unknown[]> {
    try {
      const response = await axiosInstance.get(`/predictions/race/${raceId}/history`);
      return handleApiResponse(response) as unknown[];
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /** 경주별 예측 정보 조회 (Admin 전용, 최신 1건) */
  static async getPredictionByRace(raceId: string | number): Promise<unknown> {
    try {
      const response = await axiosInstance.get(`/predictions/race/${raceId}`);
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /** 해당 경주에 대해 AI 예측 수동 생성 (Admin 전용) */
  static async generatePrediction(raceId: string | number): Promise<unknown> {
    try {
      const response = await axiosInstance.post(`/predictions/generate/${raceId}`, {}, { timeout: 120_000 });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /** [Admin] 특정 날짜 전체 경주 예측 일괄 생성 (종합 매트릭스 배치) */
  static async generateForDate(params: {
    date: string;
    meet?: string;
  }): Promise<{ requested: number; generated: number; failed: number; errors: string[] }> {
    try {
      const response = await axiosInstance.post('/predictions/generate-for-date', params, {
        timeout: 600_000,
      });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /** [Admin] 미생성 예측 일괄 생성 (기간 내 예측 없는 경주 순차 생성) */
  static async generateBatch(params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ requested: number; generated: number; failed: number; errors: string[] }> {
    try {
      const response = await axiosInstance.post('/predictions/generate-batch', params ?? {}, {
        timeout: 600_000,
      });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /**
   * [Admin] 미생성 예측 일괄 생성 (SSE 진행률 스트림).
   * onProgress receives progress events and final { done: true, ...result }.
   */
  static async generateBatchStream(
    params: { dateFrom?: string; dateTo?: string },
    onProgress: (event: {
      requested?: number;
      current?: number;
      generated?: number;
      failed?: number;
      lastRace?: string;
      retryAfter?: number;
      done?: boolean;
      errors?: string[];
      error?: string;
    }) => void,
  ): Promise<{ requested: number; generated: number; failed: number; errors: string[] }> {
    const base = (axiosInstance.defaults.baseURL ?? '').replace(/\/$/, '');
    const qs = new URLSearchParams();
    if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params.dateTo) qs.set('dateTo', params.dateTo);
    const url = `${base}/predictions/generate-batch-stream${qs.toString() ? `?${qs}` : ''}`;
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken') || localStorage.getItem('admin_token')
        : null;
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(res.statusText || 'Stream failed');
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No body');
    const dec = new TextDecoder();
    let buf = '';
    const result = { requested: 0, generated: 0, failed: 0, errors: [] as string[] };
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const parts = buf.split('\n\n');
      buf = parts.pop() ?? '';
      for (const part of parts) {
        const line = part.split('\n').find((l) => l.startsWith('data: '));
        if (!line) continue;
        try {
          const data = JSON.parse(line.slice(6)) as Record<string, unknown>;
          if (data.done === true) {
            Object.assign(result, {
              requested: data.requested ?? result.requested,
              generated: data.generated ?? result.generated,
              failed: data.failed ?? result.failed,
              errors: data.errors ?? result.errors,
            });
            onProgress(data as Parameters<typeof onProgress>[0]);
            return result;
          }
          onProgress(data as Parameters<typeof onProgress>[0]);
        } catch {
          // skip malformed event
        }
      }
    }
    if (buf) {
      const line = buf.split('\n').find((l) => l.startsWith('data: '));
      if (line) {
        try {
          const data = JSON.parse(line.slice(6)) as Record<string, unknown>;
          if (data.done === true) Object.assign(result, data);
          onProgress(data as Parameters<typeof onProgress>[0]);
        } catch {
          // skip
        }
      }
    }
    return result;
  }
}

/**
 * Admin 예측권 사용 내역 API
 */
export class AdminPredictionTicketsApi {
  static async getUsage(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    type?: string;
  }): Promise<{
    items: Array<{
      id: number;
      userId: number;
      user: { id: number; email: string; name: string; nickname?: string };
      raceId: number | null;
      race: { id: number; rcNo: string; meet: string; meetName?: string; rcDate: string; rcName?: string } | null;
      predictionId: number | null;
      prediction: { id: number; analysis: string | null; status: string; accuracy?: number; scores?: unknown } | null;
      type: string;
      usedAt: Date | null;
      matrixDate: string | null;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await axiosInstance.get('/prediction-tickets/usage', { params });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }
}

/**
 * System Config API
 */
export interface SystemConfig {
  kra_base_url_override: string;
  signup_bonus_tickets: string;
  signup_bonus_expires_days: string;
  consecutive_streak_days: string;
  consecutive_streak_tickets: string;
  consecutive_expires_days: string;
  matrix_ticket_price: string;
}

export class AdminSystemConfigApi {
  static async getConfig(): Promise<SystemConfig> {
    try {
      const response = await axiosInstance.get('/config/system');
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async updateConfig(data: Partial<SystemConfig>): Promise<SystemConfig> {
    try {
      const response = await axiosInstance.patch('/config/system', data);
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }
}

/**
 * AI Config API
 */
export class AdminAIConfigApi {
  static async getConfig(): Promise<AIConfigUpdate> {
    try {
      const response = await axiosInstance.get('/ai/config');
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async updateConfig(data: AIConfigUpdate): Promise<AIConfigUpdate> {
    try {
      const response = await axiosInstance.post('/ai/config', data);
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async estimateCost(): Promise<{ estimatedMonthlyCost?: number; enableCaching?: boolean; calculationText?: string }> {
    try {
      const response = await axiosInstance.get('/ai/estimate-cost');
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async syncResults(date?: string): Promise<any> {
    try {
      const url = date ? `/kra/sync/results?date=${date}` : '/kra/sync/results';
      const response = await axiosInstance.post(url, {}, { timeout: 300_000 });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /**
   * 경주 결과 + 출전표 보강 적재 (진행률 스트리밍).
   * date 필수 (YYYYMMDD or YYYY-MM-DD).
   */
  static async syncResultsWithProgress(
    date: string,
    callbacks: {
      onProgress?: (percent: number, message: string) => void;
    },
  ): Promise<{ result?: unknown; error?: string }> {
    const base = (axiosInstance.defaults.baseURL ?? '').replace(/\/$/, '');
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken') || localStorage.getItem('admin_token')
        : '';
    const d = date.replace(/-/g, '').slice(0, 8);
    const url = `${base}/kra/sync/results-stream?date=${encodeURIComponent(d)}`;
    const headers: Record<string, string> = { Accept: 'text/event-stream' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');
    const decoder = new TextDecoder();
    let buffer = '';
    let result: { result?: unknown; error?: string } = {};
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const dataMatch = line.match(/^data:\s*(.+)$/m);
        if (!dataMatch) continue;
        try {
          const data = JSON.parse(dataMatch[1].trim()) as Record<string, unknown>;
          if (typeof data.percent === 'number' && data.message != null) {
            callbacks.onProgress?.(data.percent, String(data.message));
          }
          if (data.done === true) {
            result = { result: data.result, error: data.error as string | undefined };
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    return result;
  }

  /** 출전표 동기화 (진행률 스트리밍). date 필수. */
  static async syncScheduleWithProgress(
    date: string,
    callbacks: { onProgress?: (percent: number, message: string) => void },
  ): Promise<{ result?: unknown; error?: string }> {
    return AdminKraApi.runStreamSync(
      `/kra/sync/schedule-stream?date=${encodeURIComponent(date.replace(/-/g, '').slice(0, 8))}`,
      callbacks,
    );
  }

  /** 전체 적재 (진행률 스트리밍). */
  static async syncAllWithProgress(
    date: string,
    callbacks: { onProgress?: (percent: number, message: string) => void },
  ): Promise<{ result?: unknown; error?: string }> {
    const d = date.replace(/-/g, '').slice(0, 8);
    return AdminKraApi.runStreamSync(`/kra/sync/all-stream?date=${d}`, callbacks);
  }

  /** 과거 데이터 적재 (진행률 스트리밍). */
  static async syncHistoricalWithProgress(
    dateFrom: string,
    dateTo: string,
    callbacks: { onProgress?: (percent: number, message: string) => void },
  ): Promise<{ result?: unknown; error?: string }> {
    const from = dateFrom.replace(/-/g, '').slice(0, 8);
    const to = dateTo.replace(/-/g, '').slice(0, 8);
    return AdminKraApi.runStreamSync(
      `/kra/sync/historical-stream?dateFrom=${from}&dateTo=${to}`,
      callbacks,
    );
  }

  private static async runStreamSync(
    path: string,
    callbacks: { onProgress?: (percent: number, message: string) => void },
  ): Promise<{ result?: unknown; error?: string }> {
    const base = (axiosInstance.defaults.baseURL ?? '').replace(/\/$/, '');
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken') || localStorage.getItem('admin_token')
        : '';
    const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
    const headers: Record<string, string> = { Accept: 'text/event-stream' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', headers });
    if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');
    const decoder = new TextDecoder();
    let buffer = '';
    let result: { result?: unknown; error?: string } = {};
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const dataMatch = line.match(/^data:\s*(.+)$/m);
        if (!dataMatch) continue;
        try {
          const data = JSON.parse(dataMatch[1].trim()) as Record<string, unknown>;
          if (typeof data.percent === 'number' && data.message != null) {
            callbacks.onProgress?.(data.percent, String(data.message));
          }
          if (data.done === true) {
            result = { result: data.result, error: data.error as string | undefined };
          }
        } catch {
          /* ignore */
        }
      }
    }
    return result;
  }

  static async syncDetails(date: string): Promise<any> {
    try {
      const response = await axiosInstance.post(`/kra/sync/details?date=${date}`, {}, { timeout: 120_000 });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async syncJockeys(meet?: string): Promise<any> {
    try {
      const url = meet ? `/kra/sync/jockeys?meet=${meet}` : '/kra/sync/jockeys';
      const response = await axiosInstance.post(url, {}, { timeout: 60_000 });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async syncDividends(date: string): Promise<{ message: string; total: number }> {
    try {
      const d = date.replace(/-/g, '').slice(0, 8);
      const response = await axiosInstance.post(`/kra/sync/dividends?date=${d}`, {}, { timeout: 120_000 });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async syncAll(date?: string): Promise<{
    message: string;
    entrySheet?: { races: number; entries: number };
    results?: { totalResults: number };
  }> {
    try {
      const d = date?.replace(/-/g, '').slice(0, 8) ||
        dayjs().tz(KST).format('YYYYMMDD');
      const response = await axiosInstance.post(`/kra/sync/all?date=${d}`, {}, { timeout: 300_000 });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async seedSample(date?: string): Promise<{ races: number; entries: number; rcDate: string }> {
    try {
      const url = date ? `/kra/seed-sample?date=${date}` : '/kra/seed-sample';
      const response = await axiosInstance.post(url);
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /** Generate AI predictions for all races on a given date that don't have one yet. */
  static async generatePredictions(date: string): Promise<{ generated: number; failed: number }> {
    try {
      const response = await axiosInstance.post(
        `/kra/generate-predictions?date=${date}`,
        {},
        { timeout: 600_000 },
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /** Batch schedules (KRA result fetch jobs: PENDING/COMPLETED/FAILED). */
  static async getBatchSchedules(params?: {
    status?: string;
    limit?: number;
  }): Promise<{
    items: Array<{
      id: number;
      jobType: string;
      targetRcDate: string;
      scheduledAt: string;
      status: string;
      startedAt: string | null;
      completedAt: string | null;
      errorMessage: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    byStatus: Record<string, number>;
  }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();
      const response = await axiosInstance.get(`/kra/batch-schedules${qs ? `?${qs}` : ''}`);
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
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
    meta: { totalPages: number; total: number };
  }> {
    try {
      const response = await axiosInstance.get<{
        data?: { races?: unknown[]; totalPages?: number; total?: number };
      }>('/races', { params });
      const body = response.data;
      const payload = body?.data ?? body;
      return {
        data: Array.isArray((payload as { races?: unknown[] })?.races)
          ? (payload as { races: unknown[] }).races
          : [],
        meta: {
          totalPages: (payload as { totalPages?: number })?.totalPages ?? 1,
          total: (payload as { total?: number })?.total ?? 0,
        },
      };
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getOne(id: string): Promise<unknown> {
    try {
      const response = await axiosInstance.get(`/races/${id}`);
      const body = response.data as { data?: unknown } | unknown;
      return body && typeof body === 'object' && 'data' in body
        ? (body as { data: unknown }).data
        : body;
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }
}

/** Race-grouped item from GET /results?groupByRace=true (same race set as GET /races) */
export interface RaceGroupDto {
  race: { id: string; meet?: string; meetName?: string; rcDate?: string; rcNo?: string; rcDist?: string };
  results: Array<{
    id?: number;
    raceId?: number;
    ord?: string;
    chulNo?: string;
    hrNo?: string;
    hrName?: string;
    jkName?: string;
    rcTime?: string;
    diffUnit?: string;
    [k: string]: unknown;
  }>;
}

/**
 * Results API — Server /api/results 사용
 */
export class AdminResultsApi {
  /**
   * Race-centric list: same filters and pagination as GET /races (경주 관리와 동일한 경기 목록).
   * Use this for admin 경기 결과 so it matches 경주 관리.
   */
  static async getAllGroupedByRace(params?: {
    page?: number;
    limit?: number;
    date?: string;
    meet?: string;
  }): Promise<{
    data: RaceGroupDto[];
    meta: { total: number; totalPages: number; page: number };
  }> {
    try {
      const response = await axiosInstance.get('/results', {
        params: { ...params, groupByRace: true },
      });
      const payload = handleApiResponse(response) as {
        raceGroups?: RaceGroupDto[];
        total?: number;
        totalPages?: number;
        page?: number;
      };
      const raceGroups = Array.isArray(payload?.raceGroups) ? payload.raceGroups : [];
      return {
        data: raceGroups,
        meta: {
          total: payload?.total ?? 0,
          totalPages: payload?.totalPages ?? 1,
          page: payload?.page ?? 1,
        },
      };
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getAll(params?: {
    page?: number;
    limit?: number;
    date?: string;
    meet?: string;
  }): Promise<AdminListResponse<unknown>> {
    try {
      const response = await axiosInstance.get('/results', { params });
      const payload = handleApiResponse(response) as {
        results?: unknown[];
        data?: unknown[];
        total?: number;
        totalPages?: number;
        page?: number;
      };
      const results = payload?.results ?? payload?.data ?? [];
      return {
        data: Array.isArray(results) ? results : [],
        meta: {
          total: payload?.total ?? 0,
          totalPages: payload?.totalPages ?? 1,
          page: payload?.page ?? 1,
        },
      };
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getOne(id: string): Promise<unknown> {
    try {
      const response = await axiosInstance.get(`/results/${id}`);
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async update(id: string, dto: { ord?: string; rcTime?: string; chaksun1?: number }): Promise<any> {
    try {
      const response = await axiosInstance.put(`/results/${id}`, dto);
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/results/${id}`);
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async send(data: { title: string; message: string; target: string }): Promise<any> {
    try {
      const response = await axiosInstance.post('/notifications/send', data);
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getUsersGrowth(days?: number): Promise<UsersGrowth[]> {
    try {
      const response = await axiosInstance.get<UsersGrowth[]>('/statistics/users-growth', {
        params: { days },
      });
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  static async getTicketUsageTrend(days?: number): Promise<TicketUsageTrend[]> {
    try {
      const response = await axiosInstance.get<TicketUsageTrend[]>(
        '/statistics/ticket-usage-trend',
        { params: { days } }
      );
      return handleApiResponse(response);
    } catch (err: unknown) {
      throw handleApiError(err);
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
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }
}

// Export instances (기존 호환성 유지)
export class AdminWeeklyPreviewApi {
  static async generate(date?: string): Promise<{ weekLabel: string; content: Record<string, unknown> }> {
    const response = await axiosInstance.post('/weekly-preview/generate', {}, {
      params: date ? { date } : {},
      timeout: 60000, // Gemini generation can take up to ~30s
    });
    return handleApiResponse(response) as { weekLabel: string; content: Record<string, unknown> };
  }

  static async getLatest(): Promise<{ weekLabel: string | null; content: Record<string, unknown> | null }> {
    const response = await axiosInstance.get('/weekly-preview/latest');
    return handleApiResponse(response) as { weekLabel: string | null; content: Record<string, unknown> | null };
  }
}

export const adminDashboardApi = AdminDashboardApi;
export const adminUsersApi = AdminUsersApi;
export const adminSubscriptionsApi = AdminSubscriptionsApi;
export const adminSinglePurchaseApi = AdminSinglePurchaseApi;
export const adminAIApi = AdminAIApi;
export const adminPredictionTicketsApi = AdminPredictionTicketsApi;
export const adminSystemConfigApi = AdminSystemConfigApi;
export const adminAIConfigApi = AdminAIConfigApi;
export const adminKraApi = AdminKraApi;
export const adminRacesApi = AdminRacesApi;
export const adminResultsApi = AdminResultsApi;
export const adminNotificationsApi = AdminNotificationsApi;
export const adminRevenueApi = AdminRevenueApi;
export const adminStatisticsApi = AdminStatisticsApi;
