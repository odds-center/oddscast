import { useState } from 'react';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import Pagination from '@/components/page/Pagination';
import { DataTable } from '@/components/ui';
import DataFetchState from '@/components/page/DataFetchState';
import RequireLogin from '@/components/page/RequireLogin';
import PointApi from '@/lib/api/pointApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { routes } from '@/lib/routes';
import { formatDateTime } from '@/lib/utils/format';

export default function PointTransactionsPage() {
  const [page, setPage] = useState(1);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['points', 'transactions', page],
    queryFn: () => PointApi.getMyTransactions({ page, limit: 20 }),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const transactions = data?.transactions ?? [];
  const totalPages = data?.totalPages ?? 1;

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
      <Layout title='OddsCast'>
        <CompactPageTitle title='포인트 거래 내역' backHref={routes.profile.index} />
        <RequireLogin />
      </Layout>
    );
  }

  return (
    <Layout title='OddsCast'>
      <CompactPageTitle title='포인트 거래 내역' backHref={routes.profile.index} />
      <DataFetchState
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        isEmpty={!transactions.length}
        emptyIcon='Gem'
        emptyTitle='거래 내역이 없습니다'
        emptyDescription='경주 적중 보상이나 예측권 구매 시 내역이 표시됩니다.'
        loadingLabel='거래 내역 준비 중...'
      >
        <DataTable
          className='rounded-xl border border-border overflow-hidden shadow-sm overflow-x-auto'
          columns={[
            { key: 'type', header: '유형', headerClassName: 'min-w-[100px]', cellClassName: 'font-medium', render: (t) => getTypeLabel(t.transactionType) },
            { key: 'desc', header: '설명', cellClassName: 'text-text-secondary', render: (t) => t.description ?? '-' },
            { key: 'amount', header: '포인트', align: 'right', headerClassName: 'w-24', cellClassName: (t) => `font-semibold ${isPositive(t.transactionType) ? 'text-emerald-600' : 'text-text-secondary'}`, render: (t) => `${isPositive(t.transactionType) ? '+' : '-'}${Math.abs(t.amount ?? 0).toLocaleString()}pt` },
            { key: 'date', header: '일시', align: 'center', headerClassName: 'w-32', cellClassName: 'text-text-tertiary', render: (t) => { const v = t.transactionTime ?? t.createdAt; return formatDateTime(v); } },
          ]}
          data={transactions}
          getRowKey={(t) => t.id}
          compact
        />
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
