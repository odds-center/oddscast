import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserApi } from '@/lib/api/userApi';
import type { UpdateUserRequest, User, UserProfile } from '@/lib/types/user';

// 현재 사용자 정보 조회 (사용자 ID가 필요함)
export const useCurrentUser = (userId: string) => {
  return useQuery({
    queryKey: ['current-user', userId],
    queryFn: () => UserApi.getUser(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 사용자 프로필 조회
export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => UserApi.getUserProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 사용자 프로필 업데이트
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updateData }: { userId: string; updateData: UpdateUserRequest }) =>
      UserApi.updateUserProfile(userId, updateData),
    onSuccess: (updatedProfile: UserProfile) => {
      // 현재 사용자 정보 업데이트
      queryClient.setQueryData(['current-user'], (oldData: User | undefined) => {
        if (oldData) {
          return { ...oldData, ...updatedProfile };
        }
        return oldData;
      });

      // 사용자 프로필 업데이트
      queryClient.setQueryData(['user-profile', updatedProfile.id], updatedProfile);
    },
  });
};

// 사용자 아바타 업로드 (구현 필요)
// export const useUploadAvatar = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (file: File) => UserApi.uploadAvatar(file),
//     onSuccess: (data: { avatarUrl: string }) => {
//       // 현재 사용자 정보 업데이트 (userId가 필요함)
//       queryClient.invalidateQueries({ queryKey: ['current-user'] });

//       // 사용자 프로필 업데이트
//       queryClient.invalidateQueries({ queryKey: ['user-profile'] });
//     },
//   });
// };

// 사용자 통계 조회
export const useUserStatistics = (userId: string) => {
  return useQuery({
    queryKey: ['user-statistics', userId],
    queryFn: () => UserApi.getUserStatistics(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 20 * 60 * 1000, // 20분
  });
};

// 사용자 성취도 목록
export const useUserAchievements = (userId: string) => {
  return useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: () => UserApi.getUserAchievements(userId),
    enabled: !!userId,
    staleTime: 30 * 60 * 1000, // 30분
    gcTime: 60 * 60 * 1000, // 1시간
  });
};

// 사용자 베팅 히스토리 (구현 필요)
// export const useUserBetHistory = (userId: string, filters?: {
//   status?: string;
//   result?: string;
//   page?: number;
//   limit?: number;
// }) => {
//   return useQuery({
//     queryKey: ['user-bet-history', userId, filters],
//     queryFn: () => UserApi.getUserBetHistory(userId, filters),
//     enabled: !!userId,
//     staleTime: 2 * 60 * 1000, // 2분
//     gcTime: 5 * 60 * 1000, // 5분
//   });
// };

// 사용자 즐겨찾기 경주 목록 (구현 필요)
// export const useUserFavoriteRaces = (userId: string) => {
//   return useQuery({
//     queryKey: ['user-favorite-races', userId],
//     queryFn: () => UserApi.getUserFavoriteRaces(userId),
//     enabled: !!userId,
//     staleTime: 2 * 60 * 1000, // 2분
//     gcTime: 5 * 60 * 1000, // 5분
//   });
// };

// 사용자 즐겨찾기 경주 추가/제거 (구현 필요)
// export const useToggleUserFavoriteRace = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ userId, raceId }: { userId: string; raceId: string }) =>
//       UserApi.toggleFavoriteRace(userId, raceId),
//     onSuccess: (data) => {
//       // 즐겨찾기 경주 목록 업데이트
//       queryClient.invalidateQueries({ queryKey: ['user-favorite-races'] });

//       // 경주 목록에서도 즐겨찾기 상태 업데이트
//       queryClient.invalidateQueries({ queryKey: ['races'] });
//     },
//   });
// };

// 사용자 설정 조회 (구현 필요)
// export const useUserSettings = (userId: string) => {
//   return useQuery({
//     queryKey: ['user-settings', userId],
//     queryFn: () => UserApi.getUserSettings(userId),
//     enabled: !!userId,
//     staleTime: 30 * 60 * 1000, // 30분
//     gcTime: 60 * 60 * 1000, // 1시간
//   });
// };

// 사용자 설정 업데이트 (구현 필요)
// export const useUpdateUserSettings = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ userId, settings }: { userId: string; settings: any }) =>
//       UserApi.getUserPreferences(userId),
//     onSuccess: () => {
//       // 사용자 설정 업데이트
//       queryClient.invalidateQueries({ queryKey: ['user-settings'] });
//     },
//   });
// };

// 계정 삭제
export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      UserApi.deleteUser(userId),
    onSuccess: () => {
      // 모든 사용자 관련 쿼리 무효화
      queryClient.clear();
    },
  });
};

// 사용자 검색 (관리자용)
export const useSearchUsers = (
  query: string,
  filters?: {
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }
) => {
  return useQuery({
    queryKey: ['search-users', query, filters],
    queryFn: () => UserApi.searchUsers(query, filters),
    enabled: !!query,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 사용자 상태 변경 (관리자용) - 구현 필요
// export const useUpdateUserStatus = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ userId, status, reason }: { userId: string; status: string; reason?: string }) =>
//       UserApi.updateUser(userId, { /* status 업데이트 로직 필요 */ }),
//     onSuccess: (updatedUser) => {
//       // 사용자 검색 결과 업데이트
//       queryClient.invalidateQueries({ queryKey: ['search-users'] });

//       // 개별 사용자 데이터 업데이트
//       queryClient.setQueryData(['user-profile', updatedUser.id], updatedUser);
//     },
//   });
// };
