import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '../api/subscriptions';

/**
 * 구독 Hook
 */
export function useSubscription() {
  const queryClient = useQueryClient();

  /**
   * 구독 상태 조회
   */
  const {
    data: subscription,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: () => subscriptionsApi.getStatus(),
  });

  /**
   * 구독 신청
   */
  const subscribe = useMutation({
    mutationFn: (userId: string) =>
      subscriptionsApi.subscribe({
        userId,
        planId: 'PREMIUM',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
    },
  });

  /**
   * 구독 취소
   */
  const cancel = useMutation({
    mutationFn: (reason?: string) => subscriptionsApi.cancel(reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-balance'] });
    },
  });

  return {
    // Queries
    subscription: subscription || null,
    isLoading,
    refetch,

    // Mutations
    subscribe,
    cancel,

    // Helpers
    isSubscribed: subscription?.isActive ?? false,
    daysUntilRenewal: subscription?.daysUntilRenewal ?? null,
    monthlyPrice: subscription?.price ?? 19800,
    monthlyTickets: subscription?.monthlyTickets ?? 30,
  };
}
