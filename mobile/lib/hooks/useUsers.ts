import { AuthApi } from '@/lib/api/authApi';
import { User } from '@/lib/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// 현재 사용자 프로필 조회
export const useCurrentUserProfile = () => {
  return useQuery({
    queryKey: ['users', 'profile'],
    queryFn: () => AuthApi.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 사용자 통계 조회 (임시로 빈 객체 반환)
export const useUserStatistics = () => {
  return useQuery({
    queryKey: ['users', 'statistics'],
    queryFn: () =>
      Promise.resolve({
        totalBets: 0,
        wonBets: 0,
        lostBets: 0,
        winRate: 0,
        totalWinnings: 0,
        totalLosses: 0,
        roi: 0,
      }),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 사용자 프로필 업데이트
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateData: Partial<User>) => AuthApi.updateProfile(updateData),
    onSuccess: (updatedUser: User) => {
      // 프로필 데이터 업데이트
      queryClient.setQueryData(['users', 'profile'], updatedUser);

      // 사용자 통계 업데이트
      queryClient.invalidateQueries({ queryKey: ['users', 'statistics'] });
    },
  });
};

// 계정 삭제 (임시로 빈 함수)
export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => Promise.resolve({ message: 'Account deleted' }),
    onSuccess: () => {
      // 모든 사용자 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['bets'] });
      queryClient.invalidateQueries({ queryKey: ['points'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

// 계정 비활성화 (임시로 빈 함수)
export const useDeactivateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => Promise.resolve({ message: 'Account deactivated' }),
    onSuccess: () => {
      // 프로필 데이터 업데이트
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
    },
  });
};

// 계정 활성화 (임시로 빈 함수)
export const useActivateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => Promise.resolve({ message: 'Account activated' }),
    onSuccess: () => {
      // 프로필 데이터 업데이트
      queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
    },
  });
};
