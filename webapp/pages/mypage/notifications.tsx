import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/page/PageHeader';
import Pagination from '@/components/page/Pagination';
import BackLink from '@/components/page/BackLink';
import NotificationApi from '@/lib/api/notificationApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { routes } from '@/lib/routes';

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
  const hasUnread = notifications.some((n: any) => n.isRead === false);

  const getLink = (n: any) => {
    const raceId = n.metadata?.raceId;
    if (raceId) return routes.races.detail(raceId);
    return null;
  };

  return (
    <Layout title='알림 — GOLDEN RACE'>
      <PageHeader
        icon='Bell'
        title='알림'
        description='경주 결과, 포인트 만료 등 알림을 확인하세요.'
      />

      {!isLoggedIn && (
        <p className='text-text-secondary text-sm mb-4'>
          <Link href={routes.auth.login} className='link-primary'>
            로그인
          </Link>
          후 확인할 수 있습니다.
        </p>
      )}

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

          {isLoading ? (
            <div className='py-16'>
              <LoadingSpinner size={28} label='알림을 불러오는 중...' />
            </div>
            ) : error ? (
              <EmptyState
                icon='AlertCircle'
                title='데이터를 불러오지 못했습니다'
                description={(error as Error)?.message}
                action={
                  <button onClick={() => refetch()} className='btn-secondary px-4 py-2 text-sm'>
                    다시 시도
                  </button>
                }
              />
            ) : (
              <div className='space-y-2'>
                {notifications.map((n: any) => {
                  const link = getLink(n);

                  return (
                    <div
                      key={n.id}
                      className={`card py-4 ${!n.isRead ? 'border-l-4 border-l-primary bg-primary/5' : ''}`}
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
                    </div>
                  );
                })}
                {notifications.length === 0 && (
                  <EmptyState
                    icon='Bell'
                    title='알림이 없습니다'
                    description='경주 결과, 포인트 알림 등이 여기에 표시됩니다.'
                  />
                )}
              </div>
            )}

            <Pagination
              page={page}
              totalPages={data?.totalPages ?? 1}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(data?.totalPages ?? 1, p + 1))}
              className='mt-6'
            />
          </>
        )}

        <BackLink href={routes.profile.index} label='내 정보로' />
    </Layout>
  );
}
