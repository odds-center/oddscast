import { useState } from 'react';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import Icon from '@/components/icons';
import { Button } from '@/components/ui/button';
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
    <Layout title='알림 | OddsCast'>
      <CompactPageTitle title='알림' backHref={routes.profile.index} />
      {!isLoggedIn && <RequireLogin />}

      {isLoggedIn && (
        <>
          {hasUnread && (
            <Button
              variant='link'
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className='mb-4 px-0'
            >
              모두 읽음으로 표시
            </Button>
          )}

          <DataFetchState
            isLoading={isLoading}
            error={error}
            onRetry={() => refetch()}
            isEmpty={!notifications.length}
            emptyIcon='Bell'
            emptyTitle='알림이 없습니다'
            emptyDescription={'경주 결과, 예측 알림 등이\n여기에 표시됩니다.'}
            loadingLabel='알림 준비 중...'
          >
            {/* Mobile: card list */}
            <div className='block sm:hidden space-y-2'>
              {notifications.map((n: Notification) => {
                const link = getLink(n);
                const body = (
                  <div className='flex items-start gap-2.5 p-3'>
                    <div className='shrink-0 mt-1'>
                      {n.isRead ? (
                        <span className='inline-block w-2 h-2 rounded-full bg-transparent' aria-hidden />
                      ) : (
                        <span className='inline-block w-2 h-2 rounded-full bg-primary' aria-hidden />
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className={`text-sm font-medium ${n.isRead ? 'text-text-secondary' : 'text-foreground'}`}>
                        {n.title}
                      </p>
                      <p className='text-xs text-text-tertiary mt-0.5 line-clamp-2'>{n.message}</p>
                      <p className='text-xs text-text-tertiary mt-1'>{formatDateTime(n.createdAt)}</p>
                    </div>
                    <div className='flex items-center gap-0.5 shrink-0'>
                      {!n.isRead && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon-sm'
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); markReadMutation.mutate(n.id); }}
                          className='text-text-tertiary'
                          aria-label='읽음으로 표시'
                        >
                          <Icon name='Check' size={16} />
                        </Button>
                      )}
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon-sm'
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteMutation.mutate(n.id); }}
                        disabled={deleteMutation.isPending}
                        className='text-text-tertiary'
                        aria-label='삭제'
                      >
                        <Icon name='Trash2' size={16} />
                      </Button>
                    </div>
                  </div>
                );
                return (
                  <div key={n.id} className={`rounded-xl border ${n.isRead ? 'border-border bg-card' : 'border-primary/30 bg-primary/5'}`}>
                    {link ? <Link href={link} className='block'>{body}</Link> : body}
                  </div>
                );
              })}
            </div>
            {/* Desktop: full table */}
            <div className='hidden sm:block'>
              <DataTable<Notification>
                className='rounded-xl border border-border overflow-hidden shadow-sm overflow-x-auto'
                columns={[
                  {
                    key: 'read',
                    header: '읽음',
                    headerClassName: 'w-14 text-center',
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
                    headerClassName: 'w-20 text-center',
                    align: 'center',
                    render: (n) => (
                      <div className='flex items-center justify-center gap-0.5'>
                        {!n.isRead && (
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon-sm'
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              markReadMutation.mutate(n.id);
                            }}
                            className='text-text-tertiary hover:text-stone-700'
                            aria-label='읽음으로 표시'
                          >
                            <Icon name='Check' size={16} />
                          </Button>
                        )}
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon-sm'
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteMutation.mutate(n.id);
                          }}
                          disabled={deleteMutation.isPending}
                          className='text-text-tertiary hover:text-error'
                          aria-label='삭제'
                        >
                          <Icon name='Trash2' size={16} />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={notifications}
                getRowKey={(n) => n.id}
                compact
                emptyMessage='알림이 없습니다.'
              />
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
