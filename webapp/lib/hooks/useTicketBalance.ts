import { useQuery } from '@tanstack/react-query';
import PredictionTicketApi from '@/lib/api/predictionTicketApi';
import { useAuthStore } from '@/lib/store/authStore';

/**
 * Returns available RACE and MATRIX ticket counts for the logged-in user.
 * Polls every 60 seconds. Returns 0 when not logged in.
 */
export function useTicketBalance() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const { data: raceData } = useQuery({
    queryKey: ['tickets', 'race-balance'],
    queryFn: () => PredictionTicketApi.getBalance(),
    enabled: isLoggedIn,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: matrixData } = useQuery({
    queryKey: ['tickets', 'matrix-balance'],
    queryFn: () => PredictionTicketApi.getMatrixBalance(),
    enabled: isLoggedIn,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return {
    raceTickets: raceData?.availableTickets ?? raceData?.available ?? 0,
    matrixTickets: matrixData?.available ?? 0,
  };
}
