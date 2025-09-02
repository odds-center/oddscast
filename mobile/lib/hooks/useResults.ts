import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resultApi } from '../api/resultApi';
import type { RaceResult } from '../api/resultApi';

// 날짜별 경주 결과 조회
export const useResults = (date: string) => {
  return useQuery({
    queryKey: ['results', 'date', date],
    queryFn: async () => {
      try {
        const result = await resultApi.getResults({ date });
        // 결과가 undefined나 null인 경우 빈 배열 반환
        return result?.results || [];
      } catch (error) {
        console.error('결과 조회 실패:', error);
        return []; // 기본값: 빈 배열
      }
    },
    enabled: !!date,
    staleTime: 2 * 60 * 1000, // 2분
  });
};

// 결과 생성 뮤테이션
export const useCreateRaceResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resultData: Omit<RaceResult, 'id' | 'createdAt' | 'updatedAt'>) =>
      resultApi.createResult(resultData),
    onSuccess: (_, variables) => {
      if (variables.raceId) {
        queryClient.invalidateQueries({ queryKey: ['results', variables.raceId] });
      }
    },
  });
};

// 결과 수정 뮤테이션
export const useUpdateRaceResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      resultId,
      resultData,
    }: {
      resultId: string;
      resultData: Partial<Omit<RaceResult, 'id' | 'createdAt' | 'updatedAt'>>;
    }) => resultApi.updateResult(resultId, resultData),
    onSuccess: (_, { resultId }) => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
    },
  });
};

// 전체 경주 결과 조회
export const useAllResults = () => {
  return useQuery({
    queryKey: ['results', 'all'],
    queryFn: async () => {
      try {
        const result = await resultApi.getResults();
        return result?.results || [];
      } catch (error) {
        console.error('전체 결과 조회 실패:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
};

// 결과 삭제 뮤테이션
export const useDeleteRaceResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resultId: string) => resultApi.deleteResult(resultId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
    },
  });
};
