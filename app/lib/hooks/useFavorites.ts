import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '@/lib/api/favorites';
import { Favorite } from '@/lib/api/types';

// 즐겨찾기 목록 조회
export const useFavorites = () => {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.getFavorites(),
    staleTime: 2 * 60 * 1000, // 2분
  });
};

// 특정 경마 즐겨찾기 여부 확인
export const useCheckFavorite = (raceId: string) => {
  return useQuery({
    queryKey: ['favorites', 'check', raceId],
    queryFn: () => favoritesApi.checkFavorite(raceId),
    enabled: !!raceId,
    staleTime: 1 * 60 * 1000, // 1분
  });
};

// 즐겨찾기 추가 뮤테이션
export const useAddFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (raceId: string) => favoritesApi.addFavorite(raceId),
    onSuccess: (data, raceId) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorites', 'check', raceId] });
    },
  });
};

// 즐겨찾기 제거 뮤테이션
export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (favoriteId: string) => favoritesApi.removeFavorite(favoriteId),
    onSuccess: (data, favoriteId) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

// 경마 ID로 즐겨찾기 제거 뮤테이션
export const useRemoveFavoriteByRaceId = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (raceId: string) => favoritesApi.removeFavoriteByRaceId(raceId),
    onSuccess: (data, raceId) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorites', 'check', raceId] });
    },
  });
};
