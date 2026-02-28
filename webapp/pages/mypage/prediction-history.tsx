import { useState } from 'react';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import Pagination from '@/components/page/Pagination';
import DataFetchState from '@/components/page/DataFetchState';
import RequireLogin from '@/components/page/RequireLogin';
import { Badge, DataTable } from '@/components/ui';
import PredictionTicketApi, { type MyPredictionHistoryItem } from '@/lib/api/predictionTicketApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import { formatDateTime, formatRcDate } from '@/lib/utils/format';

export default function PredictionHistoryPage() {
  const [page, setPage] = useState(1);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['prediction-tickets', 'my-predictions', page],
    queryFn: () => PredictionTicketApi.getMyPredictionsHistory(page, 20),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const list = data?.list ?? [];
  const totalPages = data?.totalPages ?? 1;

  const raceLabel = (item: MyPredictionHistoryItem) => {
    const r = item.race;
    if (!r) return `경주 #${item.raceId}`;
    const dateStr = formatRcDate(r.rcDate);
    return `${r.meet} ${dateStr} ${r.rcNo}경주`;
  };

  if (!isLoggedIn) {
    return (
      <Layout title='내가 본 예측 — OddsCast'>
        <CompactPageTitle title='내가 본 예측' backHref={routes.profile.index} />
        <RequireLogin />
      </Layout>
    );
  }

  return (
    <Layout title='내가 본 예측 — OddsCast'>
      <CompactPageTitle title='내가 본 예측' backHref={routes.profile.index} />
      <DataFetchState
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        isEmpty={!list.length}
        emptyIcon='ClipboardList'
        emptyTitle='열람한 예측이 없습니다'
        emptyDescription='경주 상세에서 예측권으로 AI 분석을 열람하면 여기에 표시됩니다.'
        loadingLabel='목록 불러오는 중...'
      >
        <div>
          <DataTable<MyPredictionHistoryItem>
            className='rounded-xl border border-border overflow-hidden shadow-sm overflow-x-auto'
            columns={[
              {
                key: 'race',
                header: '경주',
                headerClassName: 'min-w-[140px]',
                render: (item) => (
                  <Link
                    href={routes.races.detail(String(item.raceId))}
                    className='text-sm font-medium text-primary hover:underline whitespace-nowrap'
                  >
                    {raceLabel(item)} →
                  </Link>
                ),
              },
              {
                key: 'usedAt',
                header: '열람일',
                headerClassName: 'w-36',
                render: (item) => (
                  <span className='whitespace-nowrap text-text-secondary text-sm'>
                    {item.usedAt ? formatDateTime(item.usedAt) : '—'}
                  </span>
                ),
              },
              {
                key: 'accuracy',
                header: '정확도',
                headerClassName: 'w-20',
                align: 'center',
                render: (item) =>
                  item.accuracy != null ? (
                    <Badge variant='muted' size='md'>
                      {Number(item.accuracy).toFixed(1)}%
                    </Badge>
                  ) : (
                    <span className='text-text-tertiary'>—</span>
                  ),
              },
            ]}
            data={list}
            getRowKey={(item) => `${item.ticketId}-${item.raceId}`}
            getRowHref={(item) => routes.races.detail(String(item.raceId))}
            compact
            emptyMessage='열람한 예측이 없습니다.'
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
