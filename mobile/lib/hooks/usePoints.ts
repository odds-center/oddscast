import { useAuth } from '@/context/AuthProvider';
import { PointApi } from '@/lib/api/pointApi';
import { PointTransactionType } from '@/lib/types/point';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// 사용자 포인트 잔액 조회
export const useUserPointBalance = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['points', 'balance', user?.id],
    queryFn: async () => {
      try {
        const result = await PointApi.getUserPointBalance(user?.id || '');
        return (
          result || {
            userId: user?.id || '',
            currentPoints: 0,
            totalPointsEarned: 0,
            totalPointsSpent: 0,
            bonusPoints: 0,
            expiringPoints: 0,
            lastUpdated: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        );
      } catch (error) {
        console.error('포인트 잔액 조회 실패:', error);
        return {
          userId: user?.id || '',
          currentPoints: 0,
          totalPointsEarned: 0,
          totalPointsSpent: 0,
          bonusPoints: 0,
          expiringPoints: 0,
          lastUpdated: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 포인트 거래 내역 조회
export const usePointTransactions = (params?: {
  page?: number;
  limit?: number;
  type?: PointTransactionType;
}) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['points', 'transactions', user?.id, params],
    queryFn: () => PointApi.getPointTransactions(user?.id || '', params),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 포인트 획득 (임시로 빈 함수)
export const useEarnPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { amount: number; description: string }) =>
      Promise.resolve({ id: 'temp', ...data }),
    onSuccess: (transaction) => {
      // 포인트 잔액 업데이트
      queryClient.invalidateQueries({ queryKey: ['points', 'balance'] });

      // 거래 내역 업데이트
      queryClient.invalidateQueries({ queryKey: ['points', 'transactions'] });
    },
  });
};

// 포인트 사용 (임시로 빈 함수)
export const useSpendPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { amount: number; description: string }) =>
      Promise.resolve({ id: 'temp', ...data }),
    onSuccess: (transaction) => {
      // 포인트 잔액 업데이트
      queryClient.invalidateQueries({ queryKey: ['points', 'balance'] });

      // 거래 내역 업데이트
      queryClient.invalidateQueries({ queryKey: ['points', 'transactions'] });
    },
  });
};

// 포인트 보너스 지급 (임시로 빈 함수)
export const useAddBonusPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { amount: number; description: string; reason: string }) =>
      Promise.resolve({ id: 'temp', ...data }),
    onSuccess: (transaction) => {
      // 포인트 잔액 업데이트
      queryClient.invalidateQueries({ queryKey: ['points', 'balance'] });

      // 거래 내역 업데이트
      queryClient.invalidateQueries({ queryKey: ['points', 'transactions'] });
    },
  });
};

// 포인트 환불 (임시로 빈 함수)
export const useRefundPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { amount: number; description: string; originalTransactionId: string }) =>
      Promise.resolve({ id: 'temp', ...data }),
    onSuccess: (transaction) => {
      // 포인트 잔액 업데이트
      queryClient.invalidateQueries({ queryKey: ['points', 'balance'] });

      // 거래 내역 업데이트
      queryClient.invalidateQueries({ queryKey: ['points', 'transactions'] });
    },
  });
};
