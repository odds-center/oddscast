import { axiosInstance } from '@/lib/api/axios';
import CONFIG from '@/lib/config';
import { mockPredictions } from '@/lib/mocks/data';
import type {
  PredictionResultDto,
  PredictionStatusDto,
  PredictionPreview,
} from '../types/predictions';

/**
 * AI 예측 API
 */
export default class PredictionsApi {
  /**
   * 경주별 예측 조회 (이미 예측권 사용한 경기는 ticket 없이 재조회 가능)
   * GET /api/predictions/race/:raceId
   */
  static async getByRaceId(raceId: string): Promise<PredictionResultDto> {
    if (CONFIG.useMock) {
      const pred = mockPredictions.find((p: any) => p.raceId === raceId);
      return (pred ?? mockPredictions[0]) as unknown as PredictionResultDto;
    }
    const response = await axiosInstance.get<{ data?: PredictionResultDto } | PredictionResultDto>(
      `/predictions/race/${raceId}`,
    );
    const d = response.data as any;
    return d?.data ?? d;
  }

  /**
   * 예측 미리보기 (예측권 없어도 가능)
   * GET /predictions/race/:raceId/preview
   */
  static async getPreview(raceId: string): Promise<PredictionPreview> {
    if (CONFIG.useMock) {
      const pred = mockPredictions.find((p: any) => p.raceId === raceId);
      return (pred ?? mockPredictions[0]) as unknown as PredictionPreview;
    }
    const response = await axiosInstance.get<{ data?: PredictionPreview } | PredictionPreview>(
      `/predictions/race/${raceId}/preview`,
    );
    const d = response.data as any;
    return d?.data ?? d;
  }

  /**
   * 예측 ID로 조회
   * GET /predictions/:id
   */
  static async getById(id: string): Promise<PredictionResultDto> {
    const response = await axiosInstance.get(`/predictions/${id}`);
    const d = response.data as any;
    return d?.data ?? d;
  }

  /**
   * 모든 예측 조회
   * GET /predictions?limit=50&offset=0
   */
  static async getAll(limit = 50, offset = 0): Promise<PredictionResultDto[]> {
    const response = await axiosInstance.get('/predictions', {
      params: { limit, offset },
    });
    const d = response.data as any;
    const result = d?.data ?? d;
    return Array.isArray(result) ? result : result?.predictions ?? [];
  }

  /**
   * 평균 정확도 조회
   * GET /predictions/stats/accuracy
   */
  static async getAverageAccuracy(): Promise<{ averageAccuracy: number }> {
    const response = await axiosInstance.get('/predictions/stats/accuracy');
    const d = response.data as any;
    return d?.data ?? d;
  }

  /**
   * AI 분석 대시보드
   * GET /predictions/analytics/dashboard
   */
  static async getAnalyticsDashboard(): Promise<any> {
    const response = await axiosInstance.get('/predictions/analytics/dashboard');
    const d = response.data as any;
    return d?.data ?? d;
  }

  /**
   * 일일 통계 계산
   * POST /predictions/analytics/daily-stats
   */
  static async calculateDailyStats(date?: string): Promise<any> {
    const response = await axiosInstance.post('/predictions/analytics/daily-stats', {
      date,
    });
    const d = response.data as any;
    return d?.data ?? d;
  }

  /**
   * 실패 원인 분석
   * GET /predictions/analytics/failures
   */
  static async analyzeFailures(startDate?: string, endDate?: string): Promise<any> {
    const response = await axiosInstance.get('/predictions/analytics/failures', {
      params: { startDate, endDate },
    });
    const d = response.data as any;
    return d?.data ?? d;
  }
  /**
   * 예측 목록 (Prediction 페이지용)
   * GET /predictions → { predictions, total, page, totalPages }
   */
  static async getPredictions(limit = 20): Promise<any[]> {
    if (CONFIG.useMock) {
      return mockPredictions.slice(0, limit);
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
