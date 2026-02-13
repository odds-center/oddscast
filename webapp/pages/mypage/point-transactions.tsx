import { useState } from 'react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/page/PageHeader';
import Pagination from '@/components/page/Pagination';
import { DataTable } from '@/components/ui';
import BackLink from '@/components/page/BackLink';
import DataFetchState from '@/components/page/DataFetchState';
import RequireLogin from '@/components/page/RequireLogin';
import PointApi from '@/lib/api/pointApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery } from '@tanstack/react-query';
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
        <RequireLogin />
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

      <DataFetchState
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        isEmpty={!transactions.length}
        emptyIcon='Gem'
        emptyTitle='거래 내역이 없습니다'
        emptyDescription='경주 적중 보상이나 예측권 구매 시 내역이 표시됩니다.'
        loadingLabel='거래 내역을 불러오는 중...'
      >
        <DataTable
          columns={[
            { key: 'type', header: '유형', headerClassName: 'min-w-[100px]', cellClassName: 'font-medium', render: (t) => getTypeLabel(t.transactionType) },
            { key: 'desc', header: '설명', cellClassName: 'text-text-secondary', render: (t) => t.description ?? '-' },
            { key: 'amount', header: '포인트', align: 'right', headerClassName: 'w-24', cellClassName: (t) => `font-semibold ${isPositive(t.transactionType) ? 'text-primary' : 'text-text-secondary'}`, render: (t) => `${isPositive(t.transactionType) ? '+' : '-'}${Math.abs(t.amount ?? 0).toLocaleString()}pt` },
            { key: 'date', header: '일시', align: 'center', headerClassName: 'w-32', cellClassName: 'text-text-tertiary', render: (t) => { const v = t.transactionTime ?? t.createdAt; return v ? formatDate(v) : '-'; } },
          ]}
          data={transactions}
          getRowKey={(t) => t.id}
        />
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
