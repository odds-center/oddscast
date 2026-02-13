import Layout from '@/components/Layout';
import PageHeader from '@/components/page/PageHeader';
import SectionCard from '@/components/page/SectionCard';
import { DataTable } from '@/components/ui';
import DataFetchState from '@/components/page/DataFetchState';
import RankingApi from '@/lib/api/rankingApi';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';

export default function Ranking() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['rankings'],
    queryFn: () => RankingApi.getRankings({ limit: 20 }),
  });
  const { data: myRanking } = useQuery({
    queryKey: ['rankings', 'me'],
    queryFn: () => RankingApi.getMyRanking(),
    enabled: isLoggedIn,
  });

  return (
    <Layout title='랭킹 — GOLDEN RACE'>
      <PageHeader icon='Medal' title='예측 랭킹' description='AI 예측 적중 횟수 기준 상위 랭킹입니다.' />

      {isLoggedIn && myRanking && (
        <SectionCard title='내 랭킹' icon='User' accent className='mb-6'>
          <div className='flex items-center justify-between'>
            <span className='text-foreground font-medium'>{(myRanking as { name?: string; correctCount?: number })?.name || '나'}</span>
            <span className='text-primary font-bold'>{(myRanking as { correctCount?: number })?.correctCount ?? 0}회 적중</span>
          </div>
        </SectionCard>
      )}

      <DataFetchState
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        isEmpty={!data?.length}
        emptyIcon='Medal'
        emptyTitle='랭킹 데이터가 없습니다'
        emptyDescription='예측 적중 기록이 쌓이면 랭킹이 표시됩니다.'
        loadingLabel='랭킹을 불러오는 중...'
      >
        <DataTable
          columns={[
            { key: 'rank', header: '순위', align: 'center', headerClassName: 'w-16', cellClassName: (_, i) => `font-bold ${i === 0 ? 'text-primary' : i === 1 ? 'text-[var(--color-rank-2)]' : i === 2 ? 'text-[var(--color-rank-3)]' : 'text-text-tertiary'}`.trim(), render: (_, i) => i + 1 },
            { key: 'name', header: '이름', headerClassName: 'min-w-[120px]', cellClassName: 'font-medium', render: (item) => (item as { name?: string; user?: { name?: string }; nickname?: string }).name || (item as { user?: { name?: string }; nickname?: string }).user?.name || (item as { nickname?: string }).nickname || '-' },
            { key: 'hit', header: '적중', align: 'center', headerClassName: 'w-24', cellClassName: 'text-primary font-semibold', render: (item) => `${(item as { correctCount?: number }).correctCount ?? 0}회` },
          ]}
          data={data ?? []}
          getRowKey={(item, i) => item.id ?? i}
        />
      </DataFetchState>
    </Layout>
  );
}
