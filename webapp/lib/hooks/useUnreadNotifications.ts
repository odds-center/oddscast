import { useQuery } from '@tanstack/react-query';
import NotificationApi from '@/lib/api/notificationApi';
import { useAuthStore } from '@/lib/store/authStore';

/**
 * Returns the number of unread notifications for the logged-in user.
 * Polls every 60 seconds. Returns 0 when not logged in.
 */
export function useUnreadNotifications(): number {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const { data } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => NotificationApi.getUnreadCount(),
    enabled: isLoggedIn,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return data?.count ?? 0;
}
