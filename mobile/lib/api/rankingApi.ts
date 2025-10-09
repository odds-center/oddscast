import { apiClient } from '../utils/axios';

export interface RankingUser {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  winRate: number;
  totalBets: number;
  totalWinnings: number;
  isCurrentUser: boolean;
}

export interface RankingsResponse {
  success: boolean;
  data: RankingUser[];
  total: number;
  type: string;
}

export interface MyRankingResponse {
  success: boolean;
  data: RankingUser;
}

export class RankingApi {
  /**
   * 랭킹 목록 조회
   */
  static async getRankings(type: 'overall' | 'weekly' | 'monthly' = 'overall', limit = 10): Promise<RankingsResponse> {
    const response = await apiClient.get<RankingsResponse>('/rankings', {
      params: { type, limit },
    });
    return response.data;
  }

  /**
   * 내 랭킹 조회
   */
  static async getMyRanking(type: 'overall' | 'weekly' | 'monthly' = 'overall'): Promise<MyRankingResponse> {
    const response = await apiClient.get<MyRankingResponse>('/rankings/me', {
      params: { type },
    });
    return response.data;
  }
}

