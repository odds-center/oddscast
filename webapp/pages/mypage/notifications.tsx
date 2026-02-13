import { useState } from 'react';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import Icon from '@/components/icons';
import Pagination from '@/components/page/Pagination';
import DataFetchState from '@/components/page/DataFetchState';
import RequireLogin from '@/components/page/RequireLogin';
import { Card } from '@/components/ui';
import NotificationApi from '@/lib/api/notificationApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import type { Notification } from '@/lib/types/notification';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () =>
      NotificationApi.getNotifications({ page, limit: 20 }),
    enabled: isLoggedIn,
  });

  const markAllMutation = useMutation({
    mutationFn: () => NotificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => NotificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => NotificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const notifications = data?.notifications ?? [];
  const hasUnread = notifications.some((n: Notification) => n.isRead === false);

  const getLink = (n: Notification) => {
    const raceId = n.metadata?.raceId;
    if (raceId) return routes.races.detail(raceId);
    return null;
  };

  return (
    <Layout title='GOLDEN RACE'>
      <CompactPageTitle title='알림' backHref={routes.profile.index} />
      {!isLoggedIn && <RequireLogin />}

      {isLoggedIn && (
        <>
          {hasUnread && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className='mb-4 link-primary text-sm font-medium'
            >
              모두 읽음으로 표시
            </button>
          )}

          <DataFetchState
            isLoading={isLoading}
            error={error as Error | null}
            onRetry={() => refetch()}
            isEmpty={!notifications.length}
            emptyIcon='Bell'
            emptyTitle='알림이 없습니다'
            emptyDescription='경주 결과, 포인트 알림 등이 여기에 표시됩니다.'
            loadingLabel='알림을 불러오는 중...'
          >
            <div className='space-y-3'>
              {notifications.map((n: Notification) => {
                const link = getLink(n);
                const isUnread = !n.isRead;

                return (
                  <Card
                    key={n.id}
                    variant={isUnread ? 'accent' : 'default'}
                    className={`py-4 ${isUnread ? 'bg-primary/5' : ''}`}
                  >
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex-1 min-w-0'>
                          {link ? (
                            <Link href={link} className='block'>
                              <p className='text-foreground font-medium text-sm'>{n.title}</p>
                              <p className='text-text-secondary text-xs mt-0.5 line-clamp-2'>
                                {n.message}
                              </p>
                              <p className='text-text-tertiary text-xs mt-1'>
                                {n.createdAt ? new Date(n.createdAt).toLocaleString('ko-KR') : ''}
                              </p>
                            </Link>
                          ) : (
                            <>
                              <p className='text-foreground font-medium text-sm'>{n.title}</p>
                              <p className='text-text-secondary text-xs mt-0.5 line-clamp-2'>
                                {n.message}
                              </p>
                              <p className='text-text-tertiary text-xs mt-1'>
                                {n.createdAt ? new Date(n.createdAt).toLocaleString('ko-KR') : ''}
                              </p>
                            </>
                          )}
                        </div>
                        <div className='flex gap-1 shrink-0'>
                          {!n.isRead && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                markReadMutation.mutate(n.id);
                              }}
                              className='p-1.5 text-text-tertiary hover:text-primary transition-colors'
                              aria-label='읽음'
                            >
                              <Icon name='Check' size={16} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteMutation.mutate(n.id);
                            }}
                            disabled={deleteMutation.isPending}
                            className='p-1.5 text-text-tertiary hover:text-error transition-colors'
                            aria-label='삭제'
                          >
                            <Icon name='Trash2' size={16} />
                          </button>
                        </div>
                      </div>
                  </Card>
                );
              })}
            </div>

            <Pagination
              page={page}
              totalPages={data?.totalPages ?? 1}
              onPageChange={(p) => setPage(p)}
              className='mt-6'
            />
          </DataFetchState>
          </>
        )}

    </Layout>
  );
}
