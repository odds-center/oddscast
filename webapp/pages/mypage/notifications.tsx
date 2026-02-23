import { useState } from 'react';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import Icon from '@/components/icons';
import Pagination from '@/components/page/Pagination';
import DataFetchState from '@/components/page/DataFetchState';
import RequireLogin from '@/components/page/RequireLogin';
import { DataTable } from '@/components/ui';
import NotificationApi from '@/lib/api/notificationApi';
import { useAuthStore } from '@/lib/store/authStore';
import { formatDateTime } from '@/lib/utils/format';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
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
    placeholderData: keepPreviousData,
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
    <Layout title='OddsCast'>
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
            loadingLabel='알림 준비 중...'
          >
            <DataTable<Notification>
              className='rounded-xl border border-border overflow-hidden shadow-sm overflow-x-auto'
              columns={[
                {
                  key: 'read',
                  header: '읽음',
                  headerClassName: 'w-14 cell-center',
                  align: 'center',
                  render: (n) =>
                    n.isRead ? (
                      <span className='text-text-tertiary text-xs'>읽음</span>
                    ) : (
                      <span className='inline-block w-2 h-2 rounded-full bg-primary' aria-hidden />
                    ),
                },
                {
                  key: 'title',
                  header: '제목',
                  headerClassName: 'min-w-[120px]',
                  render: (n) => {
                    const link = getLink(n);
                    const content = (
                      <>
                        <span className='font-medium text-foreground text-sm'>{n.title}</span>
                        <span className='text-text-tertiary text-xs mt-0.5 block line-clamp-1'>
                          {n.message}
                        </span>
                      </>
                    );
                    return link ? (
                      <Link href={link} className='block min-w-0'>
                        {content}
                      </Link>
                    ) : (
                      <div className='min-w-0'>{content}</div>
                    );
                  },
                },
                {
                  key: 'date',
                  header: '날짜',
                  headerClassName: 'w-32',
                  render: (n) => (
                    <span className='whitespace-nowrap text-text-secondary text-sm'>
                      {formatDateTime(n.createdAt)}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: '액션',
                  headerClassName: 'w-20 cell-center',
                  align: 'center',
                  render: (n) => (
                    <div className='flex items-center justify-center gap-0.5'>
                      {!n.isRead && (
                        <button
                          type='button'
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            markReadMutation.mutate(n.id);
                          }}
                          className='p-1.5 text-text-tertiary hover:text-stone-700 transition-colors touch-manipulation'
                          aria-label='읽음으로 표시'
                        >
                          <Icon name='Check' size={16} />
                        </button>
                      )}
                      <button
                        type='button'
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteMutation.mutate(n.id);
                        }}
                        disabled={deleteMutation.isPending}
                        className='p-1.5 text-text-tertiary hover:text-error transition-colors touch-manipulation'
                        aria-label='삭제'
                      >
                        <Icon name='Trash2' size={16} />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={notifications}
              getRowKey={(n) => n.id}
              compact
              emptyMessage='알림이 없습니다.'
            />

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
