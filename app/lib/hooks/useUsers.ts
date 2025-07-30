import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { User, UserPreferences } from '@/lib/api/types';

// 사용자 프로필 조회
export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => usersApi.getProfile(),
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// 사용자 설정 조회
export const usePreferences = () => {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: () => usersApi.getPreferences(),
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// 프로필 업데이트 뮤테이션
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<User>) => usersApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// 설정 업데이트 뮤테이션
export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<UserPreferences>) => usersApi.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
  });
};

// 계정 삭제 뮤테이션
export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => usersApi.deleteAccount(),
    onSuccess: () => {
      queryClient.clear(); // 모든 캐시 삭제
    },
  });
};
