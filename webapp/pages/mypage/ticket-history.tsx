import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import Pagination from '@/components/page/Pagination';
import DataFetchState from '@/components/page/DataFetchState';
import RequireLogin from '@/components/page/RequireLogin';
import Icon from '@/components/icons';
import { Badge, DataTable, TabBar } from '@/components/ui';
import PredictionTicketApi from '@/lib/api/predictionTicketApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import { formatDateTime } from '@/lib/utils/format';
import type { PredictionTicket } from '@/lib/api/predictionTicketApi';

type StatusFilter = 'all' | 'AVAILABLE' | 'USED' | 'EXPIRED';

export default function TicketHistoryPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['prediction-tickets', 'history', page],
    queryFn: () => PredictionTicketApi.getHistory(50, 0, page),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const allTickets = useMemo(() => data?.tickets ?? [], [data?.tickets]);
  const tickets = useMemo(() => {
    if (statusFilter === 'all') return allTickets;
    return allTickets.filter((t: PredictionTicket) => t.status === statusFilter);
  }, [allTickets, statusFilter]);
  const totalPages = data?.totalPages ?? 1;

  const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const soonExpiringCount = useMemo(
    () =>
      allTickets.filter(
        (t: PredictionTicket) =>
          t.status === 'AVAILABLE' && t.expiresAt && new Date(t.expiresAt).getTime() < sevenDaysFromNow,
      ).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTickets],
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return '사용 가능';
      case 'USED':
        return '사용함';
      case 'EXPIRED':
        return '만료';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string): 'primary' | 'muted' | 'warning' => {
    switch (status) {
      case 'AVAILABLE':
        return 'primary';
      case 'USED':
        return 'muted';
      case 'EXPIRED':
        return 'warning';
      default:
        return 'muted';
    }
  };

  if (!isLoggedIn) {
    return (
      <Layout title='예측권 이력 | OddsCast'>
        <CompactPageTitle title='예측권 이력' backHref={routes.profile.index} />
        <RequireLogin />
      </Layout>
    );
  }

  return (
    <Layout title='예측권 이력 | OddsCast'>
      <CompactPageTitle title='예측권 이력' backHref={routes.profile.index} />
      <DataFetchState
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!tickets.length}
        emptyIcon='Ticket'
        emptyTitle={statusFilter === 'all' ? '예측권 이력이 없습니다' : '해당 상태의 이력이 없습니다'}
        emptyDescription={statusFilter === 'all' ? '예측권을 구매하거나 구독하면 이력이 표시됩니다.' : '다른 필터를 선택해 보세요.'}
        loadingLabel='이용 내역 준비 중...'
      >
        <div>
          <TabBar<StatusFilter>
            options={[
              { value: 'all', label: '전체' },
              { value: 'AVAILABLE', label: '사용 가능' },
              { value: 'USED', label: '사용함' },
              { value: 'EXPIRED', label: '만료' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            variant='subtle'
            size='sm'
            className='mb-4'
          />
          {soonExpiringCount > 0 && statusFilter !== 'EXPIRED' && statusFilter !== 'USED' && (
            <div className='flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3'>
              <Icon name='AlertCircle' size={15} className='text-amber-500 shrink-0' />
              <p className='text-sm text-amber-700 font-medium'>
                7일 이내 만료 예정 예측권 {soonExpiringCount}장 — 빨리 사용하세요!
              </p>
            </div>
          )}
          {statusFilter === 'EXPIRED' && (
            <p className='text-text-tertiary text-sm mb-3'>유효기간이 지난 예측권입니다. 사용할 수 없습니다.</p>
          )}
          <DataTable<PredictionTicket>
              className='rounded-xl border border-border overflow-hidden shadow-sm overflow-x-auto'
              columns={[
                {
                  key: 'type',
                  header: '유형',
                  headerClassName: 'w-20',
                  align: 'center',
                  render: (t) => (
                    <Badge variant={(t.type === 'MATRIX') ? 'warning' : 'primary'} size='sm'>
                      {t.type === 'MATRIX' ? '종합' : '경주'}
                    </Badge>
                  ),
                },
                {
                  key: 'status',
                  header: '상태',
                  headerClassName: 'w-24',
                  align: 'center',
                  render: (t) => (
                    <Badge variant={getStatusVariant(t.status)} size='md'>
                      {getStatusLabel(t.status)}
                    </Badge>
                  ),
                },
                {
                  key: 'race',
                  header: '경주',
                  headerClassName: 'min-w-[90px]',
                  render: (t) =>
                    t.raceId ? (
                      <Link
                        href={routes.races.detail(t.raceId)}
                        className='text-sm font-medium text-primary hover:underline whitespace-nowrap'
                      >
                        보기 →
                      </Link>
                    ) : (
                      <span className='text-text-tertiary'>—</span>
                    ),
                },
                {
                  key: 'issued',
                  header: '발급',
                  headerClassName: 'w-32',
                  render: (t) => (
                    <span className='whitespace-nowrap text-text-secondary text-sm'>
                      {formatDateTime(t.issuedAt)}
                    </span>
                  ),
                },
                {
                  key: 'expires',
                  header: '만료',
                  headerClassName: 'w-32',
                  render: (t) => (
                    <span className='whitespace-nowrap text-text-secondary text-sm'>
                      {formatDateTime(t.expiresAt)}
                    </span>
                  ),
                },
                {
                  key: 'used',
                  header: '사용',
                  headerClassName: 'w-32',
                  render: (t) =>
                    t.usedAt ? (
                      <span className='whitespace-nowrap text-text-tertiary text-sm'>
                        {formatDateTime(t.usedAt)}
                      </span>
                    ) : (
                      <span className='text-text-tertiary'>—</span>
                    ),
                },
              ]}
              data={tickets}
              getRowKey={(t) => String(t.id)}
              getRowHref={(t) => (t.raceId ? routes.races.detail(t.raceId) : undefined)}
              compact
              emptyMessage={statusFilter === 'all' ? '예측권 이력이 없습니다.' : '해당 상태의 이력이 없습니다.'}
            />
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
          className='mt-6'
        />
      </DataFetchState>
    </Layout>
  );
}
