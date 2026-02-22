import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import { routes } from '@/lib/routes';
import SectionCard from '@/components/page/SectionCard';
import { DataTable, Tooltip } from '@/components/ui';
import DataFetchState from '@/components/page/DataFetchState';
import RankingApi from '@/lib/api/rankingApi';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import type { GetServerSideProps } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { serverGet } from '@/lib/api/serverFetch';

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
    <Layout title='예측 랭킹 | GOLDEN RACE'>
      <CompactPageTitle title='예측 랭킹' backHref={routes.home} />
      <p className='text-text-tertiary text-xs mb-4 px-1'>
        <Tooltip content='AI 예측과 실제 경주 결과를 비교하여 적중 횟수가 많은 사용자 순서로 표시합니다' inline>
          적중 기준
        </Tooltip>
        : 예측권 사용 후 AI 추천마가 실제 1~3위에 들면 적중으로 인정
      </p>
      {isLoggedIn && myRanking && (
        <SectionCard title='내 랭킹' icon='User' accent className='mb-6'>
          <div className='flex items-center justify-between'>
            <span className='text-foreground font-medium'>{(myRanking as { name?: string; correctCount?: number })?.name || '나'}</span>
            <span className='text-stone-800 font-bold'>{(myRanking as { correctCount?: number })?.correctCount ?? 0}회 적중</span>
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
            { key: 'rank', header: '순위', align: 'center', headerClassName: 'w-16', cellClassName: (_, i) => `font-bold ${i === 0 ? 'text-emerald-600' : i === 1 ? 'text-[var(--color-rank-2)]' : i === 2 ? 'text-[var(--color-rank-3)]' : 'text-text-tertiary'}`.trim(), render: (_, i) => i + 1 },
            { key: 'name', header: '이름', headerClassName: 'min-w-[120px]', cellClassName: 'font-medium', render: (item) => (item as { name?: string; user?: { name?: string }; nickname?: string }).name || (item as { user?: { name?: string }; nickname?: string }).user?.name || (item as { nickname?: string }).nickname || '-' },
            { key: 'hit', header: '적중', align: 'center', headerClassName: 'w-24', cellClassName: 'text-stone-700 font-semibold', render: (item) => `${(item as { correctCount?: number }).correctCount ?? 0}회` },
          ]}
          data={data ?? []}
          getRowKey={(item, i) => item.id ?? i}
        />
      </DataFetchState>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: ['rankings'],
      queryFn: async () => {
        const res = await serverGet<{ data?: unknown[] } | unknown[]>('/rankings', { params: { limit: 20 } });
        return Array.isArray(res) ? res : (res?.data ?? []);
      },
    });
  } catch {
    // Fetch on client if SSR fails
  }
  return { props: { dehydratedState: dehydrate(queryClient) } };
};
