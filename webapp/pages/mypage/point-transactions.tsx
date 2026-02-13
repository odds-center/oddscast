import { useState } from 'react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/page/PageHeader';
import Pagination from '@/components/page/Pagination';
import BackLink from '@/components/page/BackLink';
import PointApi from '@/lib/api/pointApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { routes } from '@/lib/routes';

export default function PointTransactionsPage() {
  const [page, setPage] = useState(1);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['points', 'transactions', page],
    queryFn: () => PointApi.getMyTransactions({ page, limit: 20 }),
    enabled: isLoggedIn,
  });

  const transactions = data?.transactions ?? [];
  const totalPages = data?.totalPages ?? 1;

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      EARNED: '적중 보상',
      BONUS: '보너스',
      PROMOTION: '프로모션',
      SPENT: '사용',
      TRANSFER_IN: '입금',
      TRANSFER_OUT: '출금',
      EXPIRED: '만료',
      ADMIN_ADJUSTMENT: '관리자 조정',
    };
    return labels[type] ?? type;
  };

  const isPositive = (type: string) =>
    ['EARNED', 'BONUS', 'PROMOTION', 'TRANSFER_IN', 'ADMIN_ADJUSTMENT'].includes(type);

  if (!isLoggedIn) {
    return (
      <Layout title='포인트 거래 내역 — GOLDEN RACE'>
        <PageHeader icon='Gem' title='포인트 거래 내역' description='포인트 적립·사용 내역입니다.' />
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
    <Layout title='포인트 거래 내역 — GOLDEN RACE'>
      <PageHeader
        icon='Gem'
        title='포인트 거래 내역'
        description='포인트 적립·사용 내역입니다.'
      />

      {isLoading ? (
        <div className='py-16'>
          <LoadingSpinner size={28} label='거래 내역을 불러오는 중...' />
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
          {transactions.map((t: any) => (
            <div key={t.id} className='card py-4'>
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0 flex-1'>
                  <p className='text-foreground font-medium text-sm'>
                    {getTypeLabel(t.transactionType)}
                  </p>
                  <p className='text-text-secondary text-xs mt-0.5'>
                    {t.description ?? '-'}
                  </p>
                  <p className='text-text-tertiary text-xs mt-0.5'>
                    {formatDate(t.transactionTime ?? t.createdAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-semibold ${
                    isPositive(t.transactionType) ? 'text-primary' : 'text-text-secondary'
                  }`}
                >
                  {isPositive(t.transactionType) ? '+' : '-'}
                  {Math.abs(t.amount ?? 0).toLocaleString()}pt
                </span>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <EmptyState
              icon='Gem'
              title='거래 내역이 없습니다'
              description='경주 적중 보상이나 예측권 구매 시 내역이 표시됩니다.'
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
