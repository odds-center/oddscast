import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { singlePurchasesApi } from '../api/single-purchases';

/**
 * 개별 구매 Hook
 */
export function useSinglePurchase() {
  const queryClient = useQueryClient();

  /**
   * 예측권 구매
   */
  const purchase = useMutation({
    mutationFn: (data: { quantity?: number; pgTransactionId?: string }) =>
      singlePurchasesApi.purchase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-balance'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-history'] });
    },
  });

  /**
   * 가격 계산
   */
  const calculatePrice = async (quantity: number) => {
    return singlePurchasesApi.calculatePrice(quantity);
  };

  /**
   * 구매 내역
   */
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['purchase-history'],
    queryFn: () => singlePurchasesApi.getHistory(),
  });

  /**
   * 총 구매액
   */
  const { data: totalSpent } = useQuery({
    queryKey: ['purchase-total-spent'],
    queryFn: () => singlePurchasesApi.getTotalSpent(),
  });

  return {
    // Mutations
    purchase,

    // Queries
    history,
    historyLoading,
    totalSpent: totalSpent?.totalSpent || 0,

    // Helpers
    calculatePrice,
    pricePerTicket: 1000,
  };
}
