import type { ApiResponseDto } from '@oddscast/shared';
import { axiosInstance, handleApiResponse, handleApiError } from '@/lib/api/axios';

export interface CommunityPredictionSubmit {
  raceId: number;
  predictedHrNos: string[];
}

export interface CommunityPrediction {
  id: string;
  raceId: number;
  predictedHrNos: string[];
  score: number;
  scoredAt: string | null;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  totalScore: number;
  predictionCount: number;
  perfectPredictions: number;
  rank: number;
}

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime';

export interface Leaderboard {
  entries: LeaderboardEntry[];
  period: LeaderboardPeriod;
  generatedAt: string;
}

export interface MyPredictionsResponse {
  items: CommunityPrediction[];
  total: number;
  page: number;
  limit: number;
}

export default class CommunityPredictionsApi {
  /**
   * Submit a community prediction for a race
   * POST /api/community-predictions
   */
  static async submit(data: CommunityPredictionSubmit): Promise<CommunityPrediction> {
    try {
      const response = await axiosInstance.post<ApiResponseDto<CommunityPrediction>>(
        '/community-predictions',
        data,
      );
      return handleApiResponse<CommunityPrediction>(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /**
   * Get the authenticated user's submitted predictions
   * GET /api/community-predictions/my
   */
  static async getMyPredictions(page = 1, limit = 20): Promise<MyPredictionsResponse> {
    try {
      const response = await axiosInstance.get<ApiResponseDto<MyPredictionsResponse>>(
        '/community-predictions/my',
        { params: { page, limit } },
      );
      return handleApiResponse<MyPredictionsResponse>(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /**
   * Get the leaderboard for a given period
   * GET /api/community-predictions/leaderboard
   */
  static async getLeaderboard(period: LeaderboardPeriod = 'weekly'): Promise<Leaderboard> {
    try {
      const response = await axiosInstance.get<ApiResponseDto<Leaderboard>>(
        '/community-predictions/leaderboard',
        { params: { period } },
      );
      return handleApiResponse<Leaderboard>(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }

  /**
   * Get all community predictions for a specific race
   * GET /api/community-predictions/race/:raceId
   */
  static async getRacePredictions(raceId: number): Promise<CommunityPrediction[]> {
    try {
      const response = await axiosInstance.get<ApiResponseDto<CommunityPrediction[]>>(
        `/community-predictions/race/${raceId}`,
      );
      return handleApiResponse<CommunityPrediction[]>(response);
    } catch (err: unknown) {
      throw handleApiError(err);
    }
  }
}
