import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { racesApi } from '@/lib/api/races';
import { Race } from '@/lib/api/types';

// 경마 목록 조회
export const useRaces = (params?: { date?: string; limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: ['races', params],
    queryFn: () => racesApi.getRaces(params),
    staleTime: 2 * 60 * 1000, // 2분
  });
};

// 특정 경마 상세 조회
export const useRaceById = (raceId: string) => {
  return useQuery({
    queryKey: ['race', raceId],
    queryFn: () => racesApi.getRaceById(raceId),
    enabled: !!raceId,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// 지역별 경마 조회
export const useRacesByVenue = (
  venue: string,
  params?: {
    date?: string;
    limit?: number;
    offset?: number;
  }
) => {
  return useQuery({
    queryKey: ['races', 'venue', venue, params],
    queryFn: () => racesApi.getRacesByVenue(venue, params),
    enabled: !!venue,
    staleTime: 2 * 60 * 1000, // 2분
  });
};

// 날짜별 경마 조회
export const useRacesByDate = (
  date: string,
  params?: {
    limit?: number;
    offset?: number;
  }
) => {
  return useQuery({
    queryKey: ['races', 'date', date, params],
    queryFn: () => racesApi.getRacesByDate(date, params),
    enabled: !!date,
    staleTime: 2 * 60 * 1000, // 2분
  });
};

// KRA 경주기록 조회
export const useKRARaceRecords = (params?: {
  date?: string;
  venue?: string;
  pageNo?: number;
  numOfRows?: number;
}) => {
  return useQuery({
    queryKey: ['kra', 'records', params],
    queryFn: () => racesApi.getKRARaceRecords(params),
    staleTime: 1 * 60 * 1000, // 1분
  });
};

// KRA 경주계획표 조회
export const useKRARacePlans = (params?: {
  year?: string;
  month?: string;
  day?: string;
  venue?: string;
  pageNo?: number;
  numOfRows?: number;
}) => {
  return useQuery({
    queryKey: ['kra', 'plans', params],
    queryFn: () => racesApi.getKRARacePlans(params),
    staleTime: 1 * 60 * 1000, // 1분
  });
};
