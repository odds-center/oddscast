import { ApiResponse } from '@/lib/types/api';
import { axiosInstance, handleApiError, handleApiResponse } from '@/lib/utils/axios';

/**
 * 예측 결과 타입
 */
export interface PredictionResult {
  id: string;
  raceId: string;
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  analysis: string;
  confidence: number;
  warnings: string[];
  llmModel: string;
  llmCost: number;
  responseTime: number;
  isAccurate?: boolean;
  accuracyScore?: number;
  createdAt: string;
}

/**
 * 예측 생성 요청
 */
export interface CreatePredictionRequest {
  raceId: string;
  temperature?: number;
  maxTokens?: number;
  llmProvider?: 'openai' | 'claude';
}

/**
 * 예측 API
 */
export class PredictionsApi {
  /**
   * AI 예측 생성
   */
  static async create(data: CreatePredictionRequest): Promise<PredictionResult> {
    try {
      const response = await axiosInstance.post<ApiResponse<PredictionResult>>(
        '/predictions',
        data
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 예측 조회 (ID)
   */
  static async getById(id: string): Promise<PredictionResult> {
    try {
      const response = await axiosInstance.get<ApiResponse<PredictionResult>>(`/predictions/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 경주별 예측 조회 (예측권 필수)
   */
  static async getByRaceId(raceId: string): Promise<PredictionResult | null> {
    try {
      const response = await axiosInstance.get<ApiResponse<PredictionResult | null>>(
        `/predictions/race/${raceId}`
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 예측 미리보기 (예측권 불필요, 블러 처리용)
   */
  static async getPreview(raceId: string): Promise<{
    raceId: string;
    confidence?: number;
    hasPrediction: boolean;
    requiresTicket: boolean;
    message: string;
  }> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<{
          raceId: string;
          confidence?: number;
          hasPrediction: boolean;
          requiresTicket: boolean;
          message: string;
        }>
      >(`/predictions/race/${raceId}/preview`);
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 모든 예측 조회
   */
  static async getAll(limit = 50, offset = 0): Promise<PredictionResult[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<PredictionResult[]>>('/predictions', {
        params: { limit, offset },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 평균 정확도 조회
   */
  static async getAverageAccuracy(): Promise<{ averageAccuracy: number }> {
    try {
      const response = await axiosInstance.get<ApiResponse<{ averageAccuracy: number }>>(
        '/predictions/stats/accuracy'
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * 총 비용 조회
   */
  static async getTotalCost(): Promise<{ totalCost: number }> {
    try {
      const response = await axiosInstance.get<ApiResponse<{ totalCost: number }>>(
        '/predictions/stats/cost'
      );
      return handleApiResponse(response);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

// 기본 export
export const predictionsApi = PredictionsApi;
