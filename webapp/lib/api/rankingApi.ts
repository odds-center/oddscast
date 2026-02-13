import { axiosInstance, handleApiResponse } from '@/lib/api/axios';
import CONFIG from '@/lib/config';
import { mockRankings } from '@/lib/mocks/data';

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

export default class RankingApi {
  /**
   * 랭킹 목록 조회
   */
  static async getRankings(params: {
    type?: string;
    period?: string;
    limit?: number;
  }): Promise<RankingUser[]> {
    const { limit = 20 } = params;
    if (CONFIG.useMock) {
      return mockRankings.slice(0, limit) as unknown as RankingUser[];
    }
    const { type = 'overall' } = params;
    try {
      const response = await axiosInstance.get('/rankings', {
        params: { type, limit },
      });
      const result = handleApiResponse(response) as { data?: RankingUser[] } | RankingUser[];
      const arr = Array.isArray(result) ? result : result?.data;
      return arr ?? [];
    } catch {
      return [];
    }
  }

  /**
   * 내 랭킹 조회 (로그인 필요)
   */
  static async getMyRanking(
    type: 'overall' | 'weekly' | 'monthly' = 'overall',
  ): Promise<{ id: string; rank: number; name: string; correctCount: number; isCurrentUser: boolean } | null> {
    if (CONFIG.useMock) return null;
    try {
      const response = await axiosInstance.get('/rankings/me', { params: { type } });
      const result = handleApiResponse(response) as
        | { data?: { id: string; rank: number; name: string; correctCount: number; isCurrentUser: boolean } }
        | { id: string; rank: number; name: string; correctCount: number; isCurrentUser: boolean };
      const raw =
        typeof result === 'object' && result !== null && 'data' in result ? result.data : result;
      return (raw ?? null) as { id: string; rank: number; name: string; correctCount: number; isCurrentUser: boolean } | null;
    } catch {
      return null;
    }
  }
}
