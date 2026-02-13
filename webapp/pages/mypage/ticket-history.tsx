import { useState } from 'react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/page/PageHeader';
import Pagination from '@/components/page/Pagination';
import BackLink from '@/components/page/BackLink';
import DataFetchState from '@/components/page/DataFetchState';
import RequireLogin from '@/components/page/RequireLogin';
import { Badge, Card } from '@/components/ui';
import PredictionTicketApi from '@/lib/api/predictionTicketApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import type { PredictionTicket } from '@/lib/api/predictionTicketApi';

export default function TicketHistoryPage() {
  const [page, setPage] = useState(1);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['prediction-tickets', 'history', page],
    queryFn: () => PredictionTicketApi.getHistory(20, 0, page),
    enabled: isLoggedIn,
  });

  const tickets = data?.tickets ?? [];
  const totalPages = data?.totalPages ?? 1;

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : '-';

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
      <Layout title='예측권 이력 — GOLDEN RACE'>
        <PageHeader icon='Ticket' title='예측권 이력' description='예측권 구매·사용 내역입니다.' />
        <RequireLogin />
        <BackLink href={routes.profile.index} label='내 정보로' />
      </Layout>
    );
  }

  return (
    <Layout title='예측권 이력 — GOLDEN RACE'>
      <PageHeader
        icon='Ticket'
        title='예측권 이력'
        description='예측권 구매·사용 내역입니다.'
      />

      <DataFetchState
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        isEmpty={!tickets.length}
        emptyIcon='Ticket'
        emptyTitle='예측권 이력이 없습니다'
        emptyDescription='예측권을 구매하거나 구독하면 이력이 표시됩니다.'
        loadingLabel='이력을 불러오는 중...'
      >
        <div className='space-y-3'>
          {tickets.map((t: PredictionTicket) => (
            <Card key={t.id} className='py-4'>
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0 flex-1'>
                  <Badge variant={getStatusVariant(t.status)} size='md' className='mb-1'>
                    {getStatusLabel(t.status)}
                  </Badge>
                  <p className='text-text-secondary text-xs mt-1'>
                    발급: {formatDate(t.issuedAt)} · 만료: {formatDate(t.expiresAt)}
                  </p>
                  {t.usedAt && (
                    <p className='text-text-tertiary text-xs mt-0.5'>사용: {formatDate(t.usedAt)}</p>
                  )}
                  {t.raceId && (
                    <Link
                      href={routes.races.detail(t.raceId)}
                      className='text-primary text-xs mt-1 inline-block link-primary'
                    >
                      경주 보기 →
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          className='mt-6'
        />
      </DataFetchState>

      <BackLink href={routes.profile.index} label='내 정보로' />
    </Layout>
  );
}
