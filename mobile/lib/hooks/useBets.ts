import { BetApi } from '@/lib/api/betApi';
import { Bet, BetFilters, CreateBetRequest } from '@/lib/types/api';
import { BetStatus } from '@/lib/types/bet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// 사용자의 베팅 목록 조회
export const useUserBets = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  raceId?: string;
}) => {
  return useQuery({
    queryKey: ['bets', 'user', params],
    queryFn: async () => {
      try {
        return await BetApi.getBets(params as BetFilters);
      } catch (error) {
        console.error('사용자 베팅 목록 조회 실패:', error);
        return {
          bets: [],
          total: 0,
          page: 1,
          totalPages: 1,
        };
      }
    },
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 특정 베팅 상세 조회
export const useBetById = (id: string) => {
  return useQuery({
    queryKey: ['bets', 'detail', id],
    queryFn: async () => {
      try {
        return await BetApi.getBet(id);
      } catch (error) {
        console.error('베팅 상세 조회 실패:', error);
        throw error; // 개별 베팅은 에러를 다시 던짐
      }
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// 베팅 통계 조회
export const useBetStatistics = () => {
  return useQuery({
    queryKey: ['bets', 'statistics'],
    queryFn: async () => {
      try {
        const result = await BetApi.getBetStatistics();
        return (
          result || {
            totalBets: 0,
            totalAmount: 0,
            totalWinnings: 0,
            winRate: 0,
            averageOdds: 0,
            byType: {} as any,
            byStatus: {} as any,
            byResult: {} as any,
          }
        );
      } catch (error) {
        console.error('베팅 통계 조회 실패:', error);
        return {
          totalBets: 0,
          totalAmount: 0,
          totalWinnings: 0,
          winRate: 0,
          averageOdds: 0,
          byType: {} as any,
          byStatus: {} as any,
          byResult: {} as any,
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 활성 베팅 목록 조회
export const useActiveBets = () => {
  return useQuery({
    queryKey: ['bets', 'active'],
    queryFn: async () => {
      try {
        return await BetApi.getBets({ betStatus: BetStatus.CONFIRMED });
      } catch (error) {
        console.error('활성 베팅 목록 조회 실패:', error);
        return {
          bets: [],
          total: 0,
          page: 1,
          totalPages: 1,
        };
      }
    },
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 완료된 베팅 목록 조회
export const useCompletedBets = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['bets', 'completed', params],
    queryFn: async () => {
      try {
        return await BetApi.getBets({ ...params, betStatus: BetStatus.COMPLETED });
      } catch (error) {
        console.error('완료된 베팅 목록 조회 실패:', error);
        return {
          bets: [],
          total: 0,
          page: 1,
          totalPages: 1,
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 베팅 생성
export const useCreateBet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (betData: CreateBetRequest) => BetApi.createBet(betData),
    onSuccess: (newBet: Bet) => {
      // 베팅 목록 업데이트
      queryClient.invalidateQueries({ queryKey: ['bets', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['bets', 'active'] });

      // 베팅 통계 업데이트
      queryClient.invalidateQueries({ queryKey: ['bets', 'statistics'] });

      // 포인트 잔액 업데이트
      queryClient.invalidateQueries({ queryKey: ['points', 'balance'] });

      // 개별 베팅 데이터 추가
      queryClient.setQueryData(['bets', 'detail', newBet.id], newBet);
    },
  });
};

// 베팅 취소
export const useCancelBet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (betId: string) => BetApi.cancelBet(betId),
    onSuccess: (_, betId: string) => {
      // 베팅 목록 업데이트
      queryClient.invalidateQueries({ queryKey: ['bets', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['bets', 'active'] });

      // 베팅 통계 업데이트
      queryClient.invalidateQueries({ queryKey: ['bets', 'statistics'] });

      // 포인트 잔액 업데이트
      queryClient.invalidateQueries({ queryKey: ['points', 'balance'] });

      // 개별 베팅 데이터 제거
      queryClient.removeQueries({ queryKey: ['bets', 'detail', betId] });
    },
  });
};
