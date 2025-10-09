import { useQuery } from '@tanstack/react-query';
import { RankingApi } from '../api/rankingApi';

/**
 * 랭킹 목록 조회 hook
 */
export function useRankings(type: 'overall' | 'weekly' | 'monthly' = 'overall', limit = 10) {
  return useQuery({
    queryKey: ['rankings', type, limit],
    queryFn: () => RankingApi.getRankings(type, limit),
  });
}

/**
 * 내 랭킹 조회 hook
 */
export function useMyRanking(type: 'overall' | 'weekly' | 'monthly' = 'overall') {
  return useQuery({
    queryKey: ['myRanking', type],
    queryFn: () => RankingApi.getMyRanking(type),
  });
}
