import { RaceApi } from '@/lib/api/raceApi';
import { RaceFilters } from '@/lib/types/api';
import { useQuery } from '@tanstack/react-query';

// 모든 경주 목록 조회
export const useRaces = (params?: {
  page?: number;
  limit?: number;
  date?: string;
  meet?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['races', params],
    queryFn: async () => {
      try {
        const result = await RaceApi.getRaces(params as RaceFilters);
        return result || { races: [], total: 0, page: 1, totalPages: 1 };
      } catch (error) {
        console.error('경주 목록 조회 실패:', error);
        return { races: [], total: 0, page: 1, totalPages: 1 };
      }
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 특정 날짜의 경주 목록 조회
export const useRacesByDate = (date: string) => {
  return useQuery({
    queryKey: ['races', 'date', date],
    queryFn: async () => {
      try {
        const result = await RaceApi.getRaces({ date });
        return result || { races: [], total: 0, page: 1, totalPages: 1 };
      } catch (error) {
        console.error('특정 날짜 경주 조회 실패:', error);
        return { races: [], total: 0, page: 1, totalPages: 1 };
      }
    },
    enabled: !!date,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// 특정 경주 상세 조회
export const useRaceById = (id: string) => {
  return useQuery({
    queryKey: ['races', 'detail', id],
    queryFn: async () => {
      try {
        const result = await RaceApi.getRace(id);
        return result;
      } catch (error) {
        console.error('경주 상세 조회 실패:', error);
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// 오늘의 경주 목록 조회
export const useTodayRaces = () => {
  return useQuery({
    queryKey: ['races', 'today'],
    queryFn: async () => {
      try {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const result = await RaceApi.getRaces({ date: today });
        return result || { races: [], total: 0, page: 1, totalPages: 1 };
      } catch (error) {
        console.error('오늘의 경주 조회 실패:', error);
        return { races: [], total: 0, page: 1, totalPages: 1 };
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// 이번 주 경주 목록 조회
export const useThisWeekRaces = () => {
  return useQuery({
    queryKey: ['races', 'week', 'this'],
    queryFn: () => RaceApi.getRaces({ month: new Date().getMonth().toString() }),
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 20 * 60 * 1000, // 20분
  });
};

// 다음 주 경주 목록 조회
export const useNextWeekRaces = () => {
  return useQuery({
    queryKey: ['races', 'week', 'next'],
    queryFn: () => RaceApi.getRaces({ month: (new Date().getMonth() + 1).toString() }),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
};
