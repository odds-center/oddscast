import { useQuery } from '@tanstack/react-query';
import { resultsApi } from '@/lib/api/results';
import { RaceResult } from '@/lib/api/types';

// 경마 결과 목록 조회
export const useResults = (params?: { date?: string; limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: ['results', params],
    queryFn: () => resultsApi.getResults(params),
    staleTime: 2 * 60 * 1000, // 2분
  });
};

// 특정 경마 결과 조회
export const useResultsByRaceId = (raceId: string) => {
  return useQuery({
    queryKey: ['results', 'race', raceId],
    queryFn: () => resultsApi.getResultsByRaceId(raceId),
    enabled: !!raceId,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// 날짜별 경마 결과 조회
export const useResultsByDate = (
  date: string,
  params?: {
    limit?: number;
    offset?: number;
  }
) => {
  return useQuery({
    queryKey: ['results', 'date', date, params],
    queryFn: () => resultsApi.getResultsByDate(date, params),
    enabled: !!date,
    staleTime: 2 * 60 * 1000, // 2분
  });
};

// 지역별 경마 결과 조회
export const useResultsByVenue = (
  venue: string,
  params?: {
    date?: string;
    limit?: number;
    offset?: number;
  }
) => {
  return useQuery({
    queryKey: ['results', 'venue', venue, params],
    queryFn: () => resultsApi.getResultsByVenue(venue, params),
    enabled: !!venue,
    staleTime: 2 * 60 * 1000, // 2분
  });
};
