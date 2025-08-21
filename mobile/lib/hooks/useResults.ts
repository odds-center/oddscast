import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resultApi } from '../api/resultApi';
import type { RaceResult } from '../api/resultApi';

// 레이스 결과 조회
export const useResults = (raceId: string) => {
  return useQuery({
    queryKey: ['results', raceId],
    queryFn: () => resultApi.getRaceResults(raceId),
    enabled: !!raceId,
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
