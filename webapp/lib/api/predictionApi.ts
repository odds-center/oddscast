import { axiosInstance } from '@/lib/api/axios';
import type {
  PredictionResultDto,
  PredictionPreview,
} from '../types/predictions';

export interface BetTypeAccuracy {
  type: string;
  label: string;
  total: number;
  hit: number;
  rate: number;
}

export interface AccuracyStatsResponse {
  overall: { totalCount: number; hitCount: number; averageAccuracy: number };
  byMonth: Array<{ month: string; count: number; averageAccuracy: number }>;
  byMeet: Array<{ meet: string; count: number; averageAccuracy: number }>;
  byBetType?: BetTypeAccuracy[];
}

/**
 * AI prediction API
 */
export default class PredictionsApi {
  /**
   * Get prediction history by race ID
   * GET /api/predictions/race/:raceId/history
   */
  static async getHistoryByRaceId(
    raceId: string,
  ): Promise<PredictionResultDto[]> {
    const response = await axiosInstance.get<
      { data?: PredictionResultDto[] } | PredictionResultDto[]
    >(`/predictions/race/${raceId}/history`);
    const d = response.data as { data?: PredictionResultDto[] } | PredictionResultDto[];
    const arr = (d as { data?: PredictionResultDto[] })?.data ?? d;
    return Array.isArray(arr) ? arr : [];
  }

  /**
   * Get prediction by race ID (can re-fetch races where prediction ticket was already used, without ticket)
   * GET /api/predictions/race/:raceId
   */
  static async getByRaceId(raceId: string): Promise<PredictionResultDto> {
    const response = await axiosInstance.get<{ data?: PredictionResultDto } | PredictionResultDto>(
      `/predictions/race/${raceId}`,
    );
    const d = response.data as { data?: PredictionResultDto } | PredictionResultDto;
    return (d as { data?: PredictionResultDto })?.data ?? (d as PredictionResultDto);
  }

  /**
   * Get prediction preview (no ticket required)
   * GET /predictions/race/:raceId/preview
   */
  static async getPreview(raceId: string): Promise<PredictionPreview> {
    const response = await axiosInstance.get<{ data?: PredictionPreview } | PredictionPreview>(
      `/predictions/race/${raceId}/preview`,
    );
    const d = response.data as { data?: PredictionPreview } | PredictionPreview;
    return (d as { data?: PredictionPreview })?.data ?? (d as PredictionPreview);
  }

  /**
   * Get prediction by ID
   * GET /predictions/:id
   */
  static async getById(id: string): Promise<PredictionResultDto> {
    const response = await axiosInstance.get(`/predictions/${id}`);
    const d = response.data as { data?: PredictionResultDto } | PredictionResultDto;
    return (d as { data?: PredictionResultDto })?.data ?? (d as PredictionResultDto);
  }

  /**
   * Get all predictions
   * GET /predictions?limit=50&offset=0
   */
  static async getAll(limit = 50, offset = 0): Promise<PredictionResultDto[]> {
    const response = await axiosInstance.get('/predictions', {
      params: { limit, offset },
    });
    const d = response.data as
      | { data?: PredictionResultDto[] }
      | PredictionResultDto[]
      | { predictions?: PredictionResultDto[] };
    const result = (d as { data?: PredictionResultDto[] })?.data ?? (d as { predictions?: PredictionResultDto[] })?.predictions ?? d;
    return Array.isArray(result) ? result : (result as { predictions?: PredictionResultDto[] })?.predictions ?? [];
  }

  /**
   * Get accuracy stats for dashboard (overall, by month, by meet)
   * GET /predictions/accuracy-stats
   */
  static async getAccuracyStats(): Promise<AccuracyStatsResponse> {
    const response = await axiosInstance.get<{ data?: AccuracyStatsResponse }>(
      '/predictions/accuracy-stats',
    );
    const d = response.data;
    return (d as { data?: AccuracyStatsResponse })?.data ?? (d as AccuracyStatsResponse);
  }

  /**
   * Get average accuracy
   * GET /predictions/stats/accuracy
   */
  static async getAverageAccuracy(): Promise<{ averageAccuracy: number }> {
    const response = await axiosInstance.get('/predictions/stats/accuracy');
    const d = response.data as { data?: { averageAccuracy: number } } | { averageAccuracy: number };
    return (d as { data?: { averageAccuracy: number } })?.data ?? (d as { averageAccuracy: number });
  }

  /**
   * Get AI analysis dashboard
   * GET /predictions/analytics/dashboard
   */
  static async getAnalyticsDashboard(): Promise<Record<string, unknown>> {
    const response = await axiosInstance.get('/predictions/analytics/dashboard');
    const d = response.data as { data?: Record<string, unknown> } | Record<string, unknown>;
    return ((d as { data?: Record<string, unknown> })?.data ?? d) as Record<string, unknown>;
  }

  /**
   * Calculate daily statistics
   * POST /predictions/analytics/daily-stats
   */
  static async calculateDailyStats(date?: string): Promise<Record<string, unknown>> {
    const response = await axiosInstance.post('/predictions/analytics/daily-stats', {
      date,
    });
    const d = response.data as { data?: Record<string, unknown> } | Record<string, unknown>;
    return ((d as { data?: Record<string, unknown> })?.data ?? d) as Record<string, unknown>;
  }

  /**
   * Analyze failure causes
   * GET /predictions/analytics/failures
   */
  static async analyzeFailures(startDate?: string, endDate?: string): Promise<Record<string, unknown>> {
    const response = await axiosInstance.get('/predictions/analytics/failures', {
      params: { startDate, endDate },
    });
    const d = response.data as { data?: Record<string, unknown> } | Record<string, unknown>;
    return ((d as { data?: Record<string, unknown> })?.data ?? d) as Record<string, unknown>;
  }
  /**
   * Get prediction list (for Prediction page)
   * GET /predictions → { predictions, total, page, totalPages }
   */
  static async getPredictions(limit = 20): Promise<PredictionResultDto[]> {
    try {
      const response = await axiosInstance.get('/predictions', {
        params: { limit, page: 1 },
      });
      const result = response.data?.data ?? response.data;
      const arr = result?.predictions ?? result;
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
}
