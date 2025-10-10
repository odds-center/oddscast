import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { predictionsApi } from '../api/predictions';
import { predictionTicketsApi } from '../api/prediction-tickets';
import type { UseTicketResult } from '../api/prediction-tickets';

/**
 * AI 예측 Hook
 */
export function usePredictions() {
  const queryClient = useQueryClient();

  /**
   * 예측권 사용 (AI 예측 요청)
   */
  const usePredictionTicket = useMutation({
    mutationFn: async (raceId: string): Promise<UseTicketResult> => {
      return predictionTicketsApi.use(raceId);
    },
    onSuccess: () => {
      // 예측권 잔액 다시 로드
      queryClient.invalidateQueries({ queryKey: ['ticket-balance'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-history'] });
    },
  });

  /**
   * 예측권 잔액 조회
   */
  const {
    data: balance,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ['ticket-balance'],
    queryFn: () => predictionTicketsApi.getBalance(),
  });

  /**
   * 예측권 사용 내역
   */
  const {
    data: history,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['ticket-history'],
    queryFn: () => predictionTicketsApi.getHistory(),
  });

  /**
   * 평균 정확도 조회
   */
  const { data: accuracy } = useQuery({
    queryKey: ['prediction-accuracy'],
    queryFn: () => predictionsApi.getAverageAccuracy(),
  });

  return {
    // Mutations
    usePredictionTicket,

    // Queries
    balance,
    balanceLoading,
    refetchBalance,

    history,
    historyLoading,
    refetchHistory,

    accuracy,

    // Helpers
    hasTickets: balance && balance.availableTickets > 0,
    availableTickets: balance?.availableTickets || 0,
  };
}
