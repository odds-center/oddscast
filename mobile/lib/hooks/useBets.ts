import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BetApi } from '@/lib/api/betApi';
import type { Bet, BetFilters, CreateBetRequest, UpdateBetRequest } from '@/lib/types/bet';
import { BetResult, BetStatus, BetType } from '@/lib/types/bet';

// 베팅 목록 조회
export const useBets = (filters?: BetFilters) => {
  return useQuery({
    queryKey: ['bets', filters],
    queryFn: () => BetApi.getBets(filters),
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 개별 베팅 조회
export const useBet = (betId: string) => {
  return useQuery({
    queryKey: ['bet', betId],
    queryFn: () => BetApi.getBet(betId),
    enabled: !!betId,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 베팅 생성
export const useCreateBet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (betData: CreateBetRequest) => BetApi.createBet(betData),
    onSuccess: (newBet: Bet) => {
      // 베팅 목록 업데이트
      queryClient.invalidateQueries({ queryKey: ['bets'] });

      // 개별 베팅 데이터 추가
      queryClient.setQueryData(['bet', newBet.id], newBet);

      // 사용자 통계 업데이트
      queryClient.invalidateQueries({ queryKey: ['user-statistics'] });

      // 포인트 잔액 업데이트
      queryClient.invalidateQueries({ queryKey: ['point-balance'] });
    },
  });
};

// 베팅 업데이트
export const useUpdateBet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ betId, updateData }: { betId: string; updateData: UpdateBetRequest }) =>
      BetApi.updateBet(betId, updateData),
    onSuccess: (updatedBet: Bet, { betId }) => {
      // 베팅 목록 업데이트
      queryClient.invalidateQueries({ queryKey: ['bets'] });

      // 개별 베팅 데이터 업데이트
      queryClient.setQueryData(['bet', betId], updatedBet);
    },
  });
};

// 베팅 취소
export const useCancelBet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (betId: string) => BetApi.cancelBet(betId),
    onSuccess: (data, betId) => {
      // 베팅 목록 업데이트
      queryClient.invalidateQueries({ queryKey: ['bets'] });

      // 개별 베팅 데이터 업데이트
      queryClient.setQueryData(['bet', betId], (oldData: Bet | undefined) => {
        if (oldData) {
          return { ...oldData, betStatus: BetStatus.CANCELLED };
        }
        return oldData;
      });

      // 사용자 통계 업데이트
      queryClient.invalidateQueries({ queryKey: ['user-statistics'] });

      // 포인트 잔액 업데이트
      queryClient.invalidateQueries({ queryKey: ['point-balance'] });
    },
  });
};

// 베팅 결과 처리
export const useProcessBetResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      betId,
      result,
      actualWin,
    }: {
      betId: string;
      result: BetResult;
      actualWin?: number;
    }) => BetApi.processBetResult(betId, result, actualWin),
    onSuccess: (updatedBet: Bet, { betId }) => {
      // 베팅 목록 업데이트
      queryClient.invalidateQueries({ queryKey: ['bets'] });

      // 개별 베팅 데이터 업데이트
      queryClient.setQueryData(['bet', betId], updatedBet);

      // 사용자 통계 업데이트
      queryClient.invalidateQueries({ queryKey: ['user-statistics'] });

      // 포인트 잔액 업데이트
      queryClient.invalidateQueries({ queryKey: ['point-balance'] });
    },
  });
};

// 베팅 통계 조회
export const useBetStatistics = (filters?: {
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  betType?: BetType;
}) => {
  return useQuery({
    queryKey: ['bet-statistics', filters],
    queryFn: () => BetApi.getBetStatistics(filters),
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 20 * 60 * 1000, // 20분
  });
};

// 베팅 분석
export const useBetAnalysis = (betId: string) => {
  return useQuery({
    queryKey: ['bet-analysis', betId],
    queryFn: () => BetApi.getBetAnalysis(betId),
    enabled: !!betId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 베팅 슬립 생성
export const useCreateBetSlip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      raceId,
      bets,
    }: {
      raceId: string;
      bets: Array<{
        betType: BetType;
        amount: number;
        selections: string[];
      }>;
    }) => BetApi.createBetSlip(raceId, bets),
    onSuccess: () => {
      // 베팅 슬립 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['bet-slips'] });
    },
  });
};

// 베팅 슬립 확인
export const useConfirmBetSlip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slipId: string) => BetApi.confirmBetSlip(slipId),
    onSuccess: (data) => {
      // 베팅 목록 업데이트
      queryClient.invalidateQueries({ queryKey: ['bets'] });

      // 베팅 슬립 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['bet-slips'] });

      // 사용자 통계 업데이트
      queryClient.invalidateQueries({ queryKey: ['user-statistics'] });

      // 포인트 잔액 업데이트
      queryClient.invalidateQueries({ queryKey: ['point-balance'] });
    },
  });
};

// 베팅 히스토리
export const useBetHistory = (filters?: BetFilters) => {
  return useQuery({
    queryKey: ['bet-history', filters],
    queryFn: () => BetApi.getBetHistory(filters),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 베팅 검색
export const useSearchBets = (query: string, filters?: Omit<BetFilters, 'userId'>) => {
  return useQuery({
    queryKey: ['bet-search', query, filters],
    queryFn: () => BetApi.searchBets(query, filters),
    enabled: !!query,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 베팅 내보내기
export const useExportBets = () => {
  return useMutation({
    mutationFn: ({ filters, format }: { filters?: BetFilters; format?: 'csv' | 'excel' }) =>
      BetApi.exportBets(filters, format),
  });
};

// 베팅 상태별 필터링을 위한 유틸리티
export const useBetsByStatus = (status: BetStatus) => {
  return useQuery({
    queryKey: ['bets-by-status', status],
    queryFn: () => BetApi.getBets({ betStatus: status }),
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 베팅 결과별 필터링을 위한 유틸리티
export const useBetsByResult = (result: BetResult) => {
  return useQuery({
    queryKey: ['bets-by-result', result],
    queryFn: () => BetApi.getBets({ betResult: result }),
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 베팅 타입별 필터링을 위한 유틸리티
export const useBetsByType = (betType: BetType) => {
  return useQuery({
    queryKey: ['bets-by-type', betType],
    queryFn: () => BetApi.getBets({ betType }),
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 베팅 삭제
export const useDeleteBet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (betId: string) => BetApi.deleteBet(betId),
    onSuccess: (_, betId) => {
      // 베팅 목록 업데이트
      queryClient.invalidateQueries({ queryKey: ['bets'] });

      // 개별 베팅 데이터 제거
      queryClient.removeQueries({ queryKey: ['bet', betId] });

      // 사용자 통계 업데이트
      queryClient.invalidateQueries({ queryKey: ['user-statistics'] });
    },
  });
};
