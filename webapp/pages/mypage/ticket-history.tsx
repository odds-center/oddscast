import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import Pagination from '@/components/page/Pagination';
import DataFetchState from '@/components/page/DataFetchState';
import RequireLogin from '@/components/page/RequireLogin';
import { Badge, Card, TabBar } from '@/components/ui';
import PredictionTicketApi from '@/lib/api/predictionTicketApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery } from '@tanstack/react-query';
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
  });

  const allTickets = data?.tickets ?? [];
  const tickets = useMemo(() => {
    if (statusFilter === 'all') return allTickets;
    return allTickets.filter((t: PredictionTicket) => t.status === statusFilter);
  }, [allTickets, statusFilter]);
  const totalPages = data?.totalPages ?? 1;

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
      <Layout title='GOLDEN RACE'>
        <CompactPageTitle title='예측권 이력' backHref={routes.profile.index} />
        <RequireLogin />
      </Layout>
    );
  }

  return (
    <Layout title='GOLDEN RACE'>
      <CompactPageTitle title='예측권 이력' backHref={routes.profile.index} />
      <DataFetchState
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        isEmpty={!tickets.length}
        emptyIcon='Ticket'
        emptyTitle={statusFilter === 'all' ? '예측권 이력이 없습니다' : '해당 상태의 이력이 없습니다'}
        emptyDescription={statusFilter === 'all' ? '예측권을 구매하거나 구독하면 이력이 표시됩니다.' : '다른 필터를 선택해 보세요.'}
        loadingLabel='이력을 불러오는 중...'
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
          <div className='space-y-2'>
            {tickets.map((t: PredictionTicket) => (
              <Card key={t.id} className='p-4' variant={t.status === 'AVAILABLE' ? 'accent' : 'default'}>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2 mb-1.5'>
                      <Badge variant={getStatusVariant(t.status)} size='md'>
                        {getStatusLabel(t.status)}
                      </Badge>
                      {t.raceId && (
                        <Link
                          href={routes.races.detail(t.raceId)}
                          className='text-stone-700 text-sm font-medium hover:underline'
                        >
                          경주 보기 →
                        </Link>
                      )}
                    </div>
                    <p className='text-text-secondary text-xs'>
                      발급 {formatDateTime(t.issuedAt)} · 만료 {formatDateTime(t.expiresAt)}
                    </p>
                    {t.usedAt && (
                      <p className='text-text-tertiary text-xs mt-0.5'>사용 {formatDateTime(t.usedAt)}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
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
