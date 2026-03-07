import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import Pagination from '@/components/page/Pagination';
import { Badge, DataTable, TabBar } from '@/components/ui';
import DataFetchState from '@/components/page/DataFetchState';
import RequireLogin from '@/components/page/RequireLogin';
import PointApi from '@/lib/api/pointApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { routes } from '@/lib/routes';
import { formatDateTime } from '@/lib/utils/format';
import { PointTransactionType } from '@oddscast/shared';
import type { PointTransaction } from '@/lib/types/point';

/** All transaction types with display labels (matches server PointTransactionType enum) */
const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  [PointTransactionType.EARNED]: '적중 보상',
  [PointTransactionType.SPENT]: '사용',
  [PointTransactionType.REFUNDED]: '환불',
  [PointTransactionType.BONUS]: '보너스',
  [PointTransactionType.PROMOTION]: '프로모션',
  [PointTransactionType.ADMIN_ADJUSTMENT]: '관리자 조정',
  [PointTransactionType.EXPIRED]: '만료',
  [PointTransactionType.TRANSFER_IN]: '입금',
  [PointTransactionType.TRANSFER_OUT]: '출금',
};

/** Income = positive amount (credit) */
const INCOME_TYPES = [
  PointTransactionType.EARNED,
  PointTransactionType.BONUS,
  PointTransactionType.PROMOTION,
  PointTransactionType.REFUNDED,
  PointTransactionType.TRANSFER_IN,
  PointTransactionType.ADMIN_ADJUSTMENT,
];

/** Outgo = negative amount (debit) */
const OUTGO_TYPES = [
  PointTransactionType.SPENT,
  PointTransactionType.TRANSFER_OUT,
  PointTransactionType.EXPIRED,
];

function getTypeLabel(type: string): string {
  return TRANSACTION_TYPE_LABELS[type] ?? type;
}

function isIncome(type: string): boolean {
  return INCOME_TYPES.includes(type as PointTransactionType);
}

type TypeFilter = 'all' | 'income' | 'outgo';

export default function PointTransactionsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['points', 'transactions', page],
    queryFn: () => PointApi.getMyTransactions({ page, limit: 20 }),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const allTransactions = useMemo(() => data?.transactions ?? [], [data?.transactions]);
  const transactions = useMemo(() => {
    if (typeFilter === 'all') return allTransactions;
    if (typeFilter === 'income') return allTransactions.filter((t) => isIncome(t.transactionType));
    return allTransactions.filter((t) => OUTGO_TYPES.includes(t.transactionType as PointTransactionType));
  }, [allTransactions, typeFilter]);
  const totalPages = data?.totalPages ?? 1;

  if (!isLoggedIn) {
    return (
      <Layout title='포인트 거래 내역 | OddsCast'>
        <CompactPageTitle title='포인트 거래 내역' backHref={routes.profile.index} />
        <RequireLogin />
      </Layout>
    );
  }

  return (
    <Layout title='포인트 거래 내역 | OddsCast'>
      <CompactPageTitle title='포인트 거래 내역' backHref={routes.profile.index} />
      <DataFetchState
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!transactions.length}
        emptyIcon='Gem'
        emptyTitle='거래 내역이 없습니다'
        emptyDescription={
          typeFilter === 'all'
            ? '경주 적중 보상이나 예측권 구매 시 내역이 표시됩니다.'
            : typeFilter === 'income'
              ? '적립·입금 내역이 없습니다.'
              : '사용·출금 내역이 없습니다.'
        }
        loadingLabel='거래 내역 준비 중...'
      >
        <div>
          <TabBar<TypeFilter>
            options={[
              { value: 'all', label: '전체' },
              { value: 'income', label: '적립·입금' },
              { value: 'outgo', label: '사용·출금' },
            ]}
            value={typeFilter}
            onChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
            variant='subtle'
            size='sm'
            className='mb-4'
          />
          {/* Mobile: card list */}
          <div className='block sm:hidden space-y-2'>
            {transactions.map((t) => {
              const income = isIncome(t.transactionType);
              const dateVal = t.transactionTime ?? t.createdAt;
              return (
                <div key={String(t.id)} className='rounded-xl border border-border bg-card p-3'>
                  <div className='flex items-center justify-between gap-2'>
                    <Badge variant={income ? 'primary' : 'muted'} size='sm'>
                      {getTypeLabel(t.transactionType)}
                    </Badge>
                    <span className={`text-sm font-semibold ${income ? 'text-emerald-600' : 'text-text-secondary'}`}>
                      {income ? '+' : '-'}{Math.abs(t.amount ?? 0).toLocaleString()}pt
                    </span>
                  </div>
                  {t.description && (
                    <p className='mt-1 text-sm text-text-secondary truncate'>{t.description}</p>
                  )}
                  <p className='mt-1 text-xs text-text-tertiary'>{formatDateTime(dateVal)}</p>
                </div>
              );
            })}
          </div>
          {/* Desktop: full table */}
          <div className='hidden sm:block'>
            <DataTable<PointTransaction>
              className='rounded-xl border border-border overflow-hidden shadow-sm overflow-x-auto'
              columns={[
                {
                  key: 'type',
                  header: '유형',
                  headerClassName: 'min-w-[100px]',
                  cellClassName: 'font-medium',
                  render: (t) => (
                    <Badge
                      variant={isIncome(t.transactionType) ? 'primary' : 'muted'}
                      size='sm'
                    >
                      {getTypeLabel(t.transactionType)}
                    </Badge>
                  ),
                },
                {
                  key: 'desc',
                  header: '설명',
                  cellClassName: 'text-text-secondary',
                  render: (t) => t.description ?? '-',
                },
                {
                  key: 'amount',
                  header: '포인트',
                  align: 'right',
                  headerClassName: 'w-24',
                  cellClassName: (t) =>
                    `font-semibold ${isIncome(t.transactionType) ? 'text-emerald-600' : 'text-text-secondary'}`,
                  render: (t) =>
                    `${isIncome(t.transactionType) ? '+' : '-'}${Math.abs(t.amount ?? 0).toLocaleString()}pt`,
                },
                {
                  key: 'date',
                  header: '일시',
                  align: 'center',
                  headerClassName: 'w-32',
                  cellClassName: 'text-text-tertiary',
                  render: (t) => {
                    const v = t.transactionTime ?? t.createdAt;
                    return formatDateTime(v);
                  },
                },
              ]}
              data={transactions}
              getRowKey={(t) => String(t.id)}
              compact
            />
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
