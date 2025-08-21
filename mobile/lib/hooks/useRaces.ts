import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RaceApi } from '@/lib/api/raceApi';
import type { Race, RaceFilters, RaceResult } from '@/lib/types/race';

// 경주 목록 조회
export const useRaces = (filters?: RaceFilters) => {
  return useQuery({
    queryKey: ['races', filters],
    queryFn: () => RaceApi.getRaces(filters),
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 개별 경주 조회
export const useRace = (raceId: string) => {
  return useQuery({
    queryKey: ['race', raceId],
    queryFn: () => RaceApi.getRace(raceId),
    enabled: !!raceId,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 경주 생성
export const useCreateRace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (raceData: Partial<Race>) => RaceApi.createRace(raceData),
    onSuccess: (newRace: Race) => {
      // 경주 목록 업데이트
      queryClient.invalidateQueries({ queryKey: ['races'] });

      // 개별 경주 데이터 추가
      queryClient.setQueryData(['race', newRace.id], newRace);
    },
  });
};

// 경주 업데이트
export const useUpdateRace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ raceId, updateData }: { raceId: string; updateData: Partial<Race> }) =>
      RaceApi.updateRace(raceId, updateData),
    onSuccess: (updatedRace: Race, { raceId }) => {
      // 경주 목록 업데이트
      queryClient.invalidateQueries({ queryKey: ['races'] });

      // 개별 경주 데이터 업데이트
      queryClient.setQueryData(['race', raceId], updatedRace);
    },
  });
};

// 경주 삭제
export const useDeleteRace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (raceId: string) => RaceApi.deleteRace(raceId),
    onSuccess: (_, raceId) => {
      // 경주 목록 업데이트
      queryClient.invalidateQueries({ queryKey: ['races'] });

      // 개별 경주 데이터 제거
      queryClient.removeQueries({ queryKey: ['race', raceId] });
    },
  });
};

// 경주 결과 조회
export const useRaceResults = (raceId: string) => {
  return useQuery({
    queryKey: ['race-results', raceId],
    queryFn: () => RaceApi.getRaceResults(raceId),
    enabled: !!raceId,
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
  });
};

// 경주 결과 업데이트
export const useUpdateRaceResults = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ raceId, results }: { raceId: string; results: RaceResult[] }) =>
      RaceApi.updateRaceResults(raceId, results),
    onSuccess: (updatedResults: RaceResult[], { raceId }) => {
      // 경주 결과 업데이트
      queryClient.setQueryData(['race-results', raceId], updatedResults);

      // 경주 데이터 업데이트
      queryClient.invalidateQueries({ queryKey: ['race', raceId] });
    },
  });
};

// 경주 통계 조회
export const useRaceStatistics = (filters?: {
  dateFrom?: string;
  dateTo?: string;
  meet?: string;
  month?: string;
  year?: string;
}) => {
  return useQuery({
    queryKey: ['race-statistics', filters],
    queryFn: () => RaceApi.getRaceStatistics(filters),
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 20 * 60 * 1000, // 20분
  });
};

// 경주 분석
export const useRaceAnalysis = (raceId: string) => {
  return useQuery({
    queryKey: ['race-analysis', raceId],
    queryFn: () => RaceApi.getRaceAnalysis(raceId),
    enabled: !!raceId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 경주 일정 조회
export const useRaceSchedule = (filters?: {
  dateFrom?: string;
  dateTo?: string;
  meet?: string;
  month?: string;
  year?: string;
}) => {
  return useQuery({
    queryKey: ['race-schedule', filters],
    queryFn: () => RaceApi.getRaceSchedule(filters),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 경주 캘린더 조회
export const useRaceCalendar = (year: number, month?: number) => {
  return useQuery({
    queryKey: ['race-calendar', year, month],
    queryFn: () => RaceApi.getRaceCalendar(year, month),
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 20 * 60 * 1000, // 20분
  });
};

// 경주 검색
export const useSearchRaces = (
  query: string,
  filters?: Omit<RaceFilters, 'date' | 'month' | 'year'>
) => {
  return useQuery({
    queryKey: ['race-search', query, filters],
    queryFn: () => RaceApi.searchRaces(query, filters),
    enabled: !!query,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
};
