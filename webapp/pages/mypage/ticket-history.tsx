import { useState } from 'react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/page/PageHeader';
import Pagination from '@/components/page/Pagination';
import BackLink from '@/components/page/BackLink';
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

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'text-primary';
      case 'USED':
        return 'text-text-secondary';
      case 'EXPIRED':
        return 'text-text-tertiary';
      default:
        return '';
    }
  };

  if (!isLoggedIn) {
    return (
      <Layout title='예측권 이력 — GOLDEN RACE'>
        <PageHeader icon='Ticket' title='예측권 이력' description='예측권 구매·사용 내역입니다.' />
        <p className='text-text-secondary text-sm mb-4'>
          <Link href={routes.auth.login} className='link-primary'>
            로그인
          </Link>
          후 확인할 수 있습니다.
        </p>
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

      {isLoading ? (
        <div className='py-16'>
          <LoadingSpinner size={28} label='이력을 불러오는 중...' />
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
          {tickets.map((t: PredictionTicket) => (
            <div key={t.id} className='card py-4'>
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0 flex-1'>
                  <p className='text-foreground font-medium text-sm'>
                    {getStatusLabel(t.status)}
                  </p>
                  <p className='text-text-secondary text-xs mt-0.5'>
                    발급: {formatDate(t.issuedAt)} · 만료: {formatDate(t.expiresAt)}
                  </p>
                  {t.usedAt && (
                    <p className='text-text-tertiary text-xs mt-0.5'>사용: {formatDate(t.usedAt)}</p>
                  )}
                  {t.raceId && (
                    <Link
                      href={routes.races.detail(t.raceId)}
                      className='text-primary text-xs mt-1 inline-block'
                    >
                      경주 보기 →
                    </Link>
                  )}
                </div>
                <span className={`shrink-0 text-xs font-medium ${getStatusClass(t.status)}`}>
                  {getStatusLabel(t.status)}
                </span>
              </div>
            </div>
          ))}
          {tickets.length === 0 && (
            <EmptyState
              icon='Ticket'
              title='예측권 이력이 없습니다'
              description='예측권을 구매하거나 구독하면 이력이 표시됩니다.'
            />
          )}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          className='mt-6'
        />
      )}

      <BackLink href={routes.profile.index} label='내 정보로' />
    </Layout>
  );
}
