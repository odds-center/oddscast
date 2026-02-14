import { axiosInstance } from '@/lib/api/axios';
import CONFIG from '@/lib/config';
import { mockPredictions } from '@/lib/mocks/data';
import type {
  PredictionResultDto,
  PredictionPreview,
} from '../types/predictions';

/**
 * AI 예측 API
 */
export default class PredictionsApi {
  /**
   * 경주별 예측 기록 목록
   * GET /api/predictions/race/:raceId/history
   */
  static async getHistoryByRaceId(
    raceId: string,
  ): Promise<PredictionResultDto[]> {
    if (CONFIG.useMock) {
      const pred = mockPredictions.find((p: { raceId?: string }) => p.raceId === raceId);
      return pred ? [pred as unknown as PredictionResultDto] : [];
    }
    const response = await axiosInstance.get<
      { data?: PredictionResultDto[] } | PredictionResultDto[]
    >(`/predictions/race/${raceId}/history`);
    const d = response.data as { data?: PredictionResultDto[] } | PredictionResultDto[];
    const arr = (d as { data?: PredictionResultDto[] })?.data ?? d;
    return Array.isArray(arr) ? arr : [];
  }

  /**
   * 경주별 예측 조회 (이미 예측권 사용한 경기는 ticket 없이 재조회 가능)
   * GET /api/predictions/race/:raceId
   */
  static async getByRaceId(raceId: string): Promise<PredictionResultDto> {
    if (CONFIG.useMock) {
      const pred = mockPredictions.find((p: { raceId?: string }) => p.raceId === raceId);
      return (pred ?? mockPredictions[0]) as unknown as PredictionResultDto;
    }
    const response = await axiosInstance.get<{ data?: PredictionResultDto } | PredictionResultDto>(
      `/predictions/race/${raceId}`,
    );
    const d = response.data as { data?: PredictionResultDto } | PredictionResultDto;
    return (d as { data?: PredictionResultDto })?.data ?? (d as PredictionResultDto);
  }

  /**
   * 예측 미리보기 (예측권 없어도 가능)
   * GET /predictions/race/:raceId/preview
   */
  static async getPreview(raceId: string): Promise<PredictionPreview> {
    if (CONFIG.useMock) {
      const pred = mockPredictions.find((p: { raceId?: string }) => p.raceId === raceId);
      return (pred ?? mockPredictions[0]) as unknown as PredictionPreview;
    }
    const response = await axiosInstance.get<{ data?: PredictionPreview } | PredictionPreview>(
      `/predictions/race/${raceId}/preview`,
    );
    const d = response.data as { data?: PredictionPreview } | PredictionPreview;
    return (d as { data?: PredictionPreview })?.data ?? (d as PredictionPreview);
  }

  /**
   * 예측 ID로 조회
   * GET /predictions/:id
   */
  static async getById(id: string): Promise<PredictionResultDto> {
    const response = await axiosInstance.get(`/predictions/${id}`);
    const d = response.data as { data?: PredictionResultDto } | PredictionResultDto;
    return (d as { data?: PredictionResultDto })?.data ?? (d as PredictionResultDto);
  }

  /**
   * 모든 예측 조회
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
   * 평균 정확도 조회
   * GET /predictions/stats/accuracy
   */
  static async getAverageAccuracy(): Promise<{ averageAccuracy: number }> {
    const response = await axiosInstance.get('/predictions/stats/accuracy');
    const d = response.data as { data?: { averageAccuracy: number } } | { averageAccuracy: number };
    return (d as { data?: { averageAccuracy: number } })?.data ?? (d as { averageAccuracy: number });
  }

  /**
   * AI 분석 대시보드
   * GET /predictions/analytics/dashboard
   */
  static async getAnalyticsDashboard(): Promise<Record<string, unknown>> {
    const response = await axiosInstance.get('/predictions/analytics/dashboard');
    const d = response.data as { data?: Record<string, unknown> } | Record<string, unknown>;
    return ((d as { data?: Record<string, unknown> })?.data ?? d) as Record<string, unknown>;
  }

  /**
   * 일일 통계 계산
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
   * 실패 원인 분석
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
   * 예측 목록 (Prediction 페이지용)
   * GET /predictions → { predictions, total, page, totalPages }
   */
  static async getPredictions(limit = 20): Promise<PredictionResultDto[]> {
    if (CONFIG.useMock) {
      return mockPredictions.slice(0, limit) as unknown as PredictionResultDto[];
    }
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
