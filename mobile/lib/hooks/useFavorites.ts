import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoriteApi } from '@/lib/api/favoriteApi';
import type { CreateFavoriteRequest, FavoriteFilters } from '@/lib/types/favorite';

// 즐겨찾기 목록 조회
export const useFavorites = (filters?: FavoriteFilters) => {
  return useQuery({
    queryKey: ['favorites', filters],
    queryFn: () => favoriteApi.getFavorites(filters),
    staleTime: 2 * 60 * 1000, // 2분
  });
};

// 즐겨찾기 추가 뮤테이션
export const useAddFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (favoriteData: CreateFavoriteRequest) => favoriteApi.createFavorite(favoriteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

// 즐겨찾기 제거 뮤테이션
export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (favoriteId: string) => favoriteApi.deleteFavorite(favoriteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

// 즐겨찾기 토글 뮤테이션
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      targetId,
      targetName,
      targetData,
    }: {
      type: 'RACE' | 'HORSE' | 'JOCKEY' | 'TRAINER' | 'MEET';
      targetId: string;
      targetName: string;
      targetData?: any;
    }) => favoriteApi.toggleFavorite(type, targetId, targetName, targetData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

// 즐겨찾기 확인
export const useCheckFavorite = (
  type: 'RACE' | 'HORSE' | 'JOCKEY' | 'TRAINER' | 'MEET',
  targetId: string
) => {
  return useQuery({
    queryKey: ['favorites', 'check', type, targetId],
    queryFn: () => favoriteApi.checkFavorite(type, targetId),
    enabled: !!type && !!targetId,
    staleTime: 1 * 60 * 1000, // 1분
  });
};

// 즐겨찾기 통계
export const useFavoriteStatistics = () => {
  return useQuery({
    queryKey: ['favorites', 'statistics'],
    queryFn: () => favoriteApi.getFavoriteStatistics(),
    staleTime: 5 * 60 * 1000, // 5분
  });
};
