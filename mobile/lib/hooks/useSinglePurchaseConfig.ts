import { useQuery } from '@tanstack/react-query';
import { getSinglePurchaseConfig, SinglePurchaseConfig } from '../api/singlePurchaseApi';

/**
 * 개별 구매 설정 조회 Hook
 */
export const useSinglePurchaseConfig = () => {
  return useQuery<SinglePurchaseConfig, Error>({
    queryKey: ['singlePurchaseConfig'],
    queryFn: getSinglePurchaseConfig,
    staleTime: 1000 * 60 * 60, // 1시간 동안 캐시 유지
    gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 가비지 컬렉션 방지
  });
};
