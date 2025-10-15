import { axiosInstance } from '../utils/axios';
import type {
  PredictionResultDto,
  PredictionStatusDto,
  PredictionPreview,
} from '../types/predictions';

/**
 * AI 예측 API
 */
export const predictionsApi = {
  /**
   * 경주별 예측 조회 (예측권 필수)
   * GET /api/predictions/race/:raceId
   */
  async getByRaceId(raceId: string): Promise<PredictionResultDto> {
    const response = await axiosInstance.get<PredictionResultDto>(
      `/api/predictions/race/${raceId}`
    );
    return response.data;
  },

  /**
   * 예측 미리보기 (예측권 없어도 가능)
   * GET /api/predictions/race/:raceId/preview
   */
  async getPreview(raceId: string): Promise<PredictionPreview> {
    const response = await axiosInstance.get<PredictionPreview>(
      `/api/predictions/race/${raceId}/preview`
    );
    return response.data;
  },

  /**
   * 예측 ID로 조회
   * GET /api/predictions/:id
   */
  async getById(id: string): Promise<PredictionResultDto> {
    const response = await axiosInstance.get<PredictionResultDto>(`/api/predictions/${id}`);
    return response.data;
  },

  /**
   * 모든 예측 조회
   * GET /api/predictions?limit=50&offset=0
   */
  async getAll(limit = 50, offset = 0): Promise<PredictionResultDto[]> {
    const response = await axiosInstance.get<PredictionResultDto[]>('/api/predictions', {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * 평균 정확도 조회
   * GET /api/predictions/stats/accuracy
   */
  async getAverageAccuracy(): Promise<{ averageAccuracy: number }> {
    const response = await axiosInstance.get<{ averageAccuracy: number }>(
      '/api/predictions/stats/accuracy'
    );
    return response.data;
  },

  /**
   * AI 분석 대시보드
   * GET /api/predictions/analytics/dashboard
   */
  async getAnalyticsDashboard(): Promise<any> {
    const response = await axiosInstance.get('/api/predictions/analytics/dashboard');
    return response.data;
  },

  /**
   * 일일 통계 계산
   * POST /api/predictions/analytics/daily-stats
   */
  async calculateDailyStats(date?: string): Promise<any> {
    const response = await axiosInstance.post('/api/predictions/analytics/daily-stats', {
      date,
    });
    return response.data;
  },

  /**
   * 실패 원인 분석
   * GET /api/predictions/analytics/failures
   */
  async analyzeFailures(startDate?: string, endDate?: string): Promise<any> {
    const response = await axiosInstance.get('/api/predictions/analytics/failures', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};
