import { useAuth } from '@/context/AuthProvider';
import { FavoriteApi } from '@/lib/api/favoriteApi';
import { CreateFavoriteRequest, Favorite, FavoriteFilters } from '@/lib/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// 즐겨찾기 타입 정의
type FavoriteType = 'RACE' | 'HORSE' | 'JOCKEY' | 'TRAINER' | 'MEET';

// FavoriteApi 인스턴스 생성
const favoriteApi = FavoriteApi.getInstance();

// 즐겨찾기 목록 조회
export const useFavorites = (params?: { page?: number; limit?: number; type?: string }) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites', user?.id, params],
    queryFn: () => favoriteApi.getFavorites(params as FavoriteFilters),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 말 즐겨찾기 목록 조회
export const useHorseFavorites = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites', 'horses', user?.id],
    queryFn: () => favoriteApi.getFavorites({ type: 'HORSE' }),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 경주 즐겨찾기 목록 조회
export const useRaceFavorites = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites', 'races', user?.id],
    queryFn: () => favoriteApi.getFavorites({ type: 'RACE' }),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 즐겨찾기 확인
export const useCheckFavorite = (type: string, targetId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorites', 'check', type, targetId, user?.id],
    queryFn: () => favoriteApi.checkFavorite(type as FavoriteType, targetId),
    enabled: !!user?.id && !!type && !!targetId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 즐겨찾기 추가
export const useAddFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { type: FavoriteType; targetId: string; targetName: string }) =>
      favoriteApi.createFavorite(data as CreateFavoriteRequest),
    onSuccess: (newFavorite: Favorite) => {
      // 즐겨찾기 목록 업데이트
      queryClient.invalidateQueries({ queryKey: ['favorites'] });

      // 타입별 즐겨찾기 목록 업데이트
      if (newFavorite.type === 'HORSE') {
        queryClient.invalidateQueries({ queryKey: ['favorites', 'horses'] });
      } else if (newFavorite.type === 'RACE') {
        queryClient.invalidateQueries({ queryKey: ['favorites', 'races'] });
      }

      // 즐겨찾기 상태 업데이트
      queryClient.setQueryData(
        ['favorites', 'check', newFavorite.type, newFavorite.targetId],
        true
      );
    },
  });
};

// 즐겨찾기 삭제
export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (favoriteId: string) => favoriteApi.deleteFavorite(favoriteId),
    onSuccess: (_, favoriteId: string) => {
      // 즐겨찾기 목록 업데이트
      queryClient.invalidateQueries({ queryKey: ['favorites'] });

      // 타입별 즐겨찾기 목록 업데이트
      queryClient.invalidateQueries({ queryKey: ['favorites', 'horses'] });
      queryClient.invalidateQueries({ queryKey: ['favorites', 'races'] });

      // 개별 즐겨찾기 데이터 제거
      queryClient.removeQueries({ queryKey: ['favorites', 'detail', favoriteId] });
    },
  });
};
