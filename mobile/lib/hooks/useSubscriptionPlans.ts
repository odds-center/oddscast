import { useQuery } from '@tanstack/react-query';
import { getSubscriptionPlans, SubscriptionPlan } from '../api/subscriptionPlansApi';

/**
 * 구독 플랜 목록 조회 Hook
 */
export const useSubscriptionPlans = () => {
  return useQuery<SubscriptionPlan[], Error>({
    queryKey: ['subscriptionPlans'],
    queryFn: getSubscriptionPlans,
    staleTime: 1000 * 60 * 60, // 1시간 동안 캐시 유지
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 가비지 컬렉션 방지
  });
};
