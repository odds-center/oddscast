import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PointApi } from '@/lib/api/pointApi';
import type {
  CreatePointRequest,
  PointTransferRequest,
  PointTransactionFilters,
} from '@/lib/types/point';

// 포인트 잔액 조회 훅
export const useUserPointBalance = (userId: string) => {
  return useQuery({
    queryKey: ['points', 'balance', userId],
    queryFn: () => PointApi.getUserPointBalance(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 포인트 거래 내역 조회 훅
export const usePointTransactions = (userId: string, filters?: PointTransactionFilters) => {
  return useQuery({
    queryKey: ['points', 'transactions', userId, filters],
    queryFn: () => PointApi.getPointTransactions(userId, filters),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 포인트 통계 조회 훅
export const usePointStatistics = (userId: string) => {
  return useQuery({
    queryKey: ['points', 'statistics', userId],
    queryFn: () => PointApi.getPointStatistics(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 20 * 60 * 1000, // 20분
  });
};

// 포인트 거래 내역 검색 훅
export const useSearchPointTransactions = (
  userId: string,
  query: string,
  filters?: Omit<PointTransactionFilters, 'userId'>
) => {
  return useQuery({
    queryKey: ['points', 'transactions', 'search', userId, query, filters],
    queryFn: () => PointApi.searchPointTransactions(userId, query, filters),
    enabled: !!userId && !!query && query.length > 0,
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 2 * 60 * 1000, // 2분
  });
};

// 포인트 추가 뮤테이션 훅
export const useAddPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      transactionData,
    }: {
      userId: string;
      transactionData: CreatePointRequest;
    }) => PointApi.createPointTransaction(userId, transactionData),
    onSuccess: (_, { userId }) => {
      // 포인트 잔액과 거래 내역 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['points', 'balance', userId] });
      queryClient.invalidateQueries({ queryKey: ['points', 'transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['points', 'statistics', userId] });
    },
  });
};

// 포인트 이체 뮤테이션 훅
export const useTransferPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transferData: PointTransferRequest) => PointApi.transferPoints(transferData),
    onSuccess: (_, transferData) => {
      // 포인트 잔액과 거래 내역 캐시 무효화 (송금자와 수신자 모두)
      const { fromUserId, toUserId } = transferData;
      if (fromUserId) {
        queryClient.invalidateQueries({ queryKey: ['points', 'balance', fromUserId] });
        queryClient.invalidateQueries({ queryKey: ['points', 'transactions', fromUserId] });
        queryClient.invalidateQueries({ queryKey: ['points', 'statistics', fromUserId] });
      }
      if (toUserId) {
        queryClient.invalidateQueries({ queryKey: ['points', 'balance', toUserId] });
        queryClient.invalidateQueries({ queryKey: ['points', 'transactions', toUserId] });
        queryClient.invalidateQueries({ queryKey: ['points', 'statistics', toUserId] });
      }
    },
  });
};

// 포인트 관련 모든 데이터 새로고침 훅
export const useRefreshPoints = (userId: string) => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['points', userId] });
  };
};
