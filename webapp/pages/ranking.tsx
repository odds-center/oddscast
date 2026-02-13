import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/page/PageHeader';
import SectionCard from '@/components/page/SectionCard';
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
            <span className='text-foreground font-medium'>{myRanking.name || '나'}</span>
            <span className='text-primary font-bold'>{myRanking.correctCount ?? 0}회 적중</span>
          </div>
        </SectionCard>
      )}

      {isLoading ? (
        <div className='py-16'>
          <LoadingSpinner size={24} label='랭킹을 불러오는 중...' />
        </div>
      ) : error ? (
        <EmptyState
          icon='AlertCircle'
          title='랭킹을 불러오지 못했습니다'
          description={(error as Error)?.message || '잠시 후 다시 시도해주세요.'}
          action={
            <button onClick={() => refetch()} className='btn-secondary px-4 py-2 text-sm'>
              다시 시도
            </button>
          }
        />
      ) : (
        <div className='space-y-2'>
          {data?.map((item: any, i: number) => (
            <div
              key={item.id || i}
              className={`card flex items-center gap-3 md:gap-4 transition-colors ${
                i < 3 ? 'border-primary/30 bg-primary/5' : ''
              }`}
            >
              <span
                className={`font-bold w-8 md:w-10 text-center shrink-0 ${
                  i === 0
                    ? 'text-primary text-lg'
                    : i === 1
                      ? 'text-text-secondary'
                      : i === 2
                        ? 'text-amber-600'
                        : 'text-text-tertiary'
                }`}
              >
                {i + 1}
              </span>
              <span className='text-foreground font-medium flex-1'>
                {item.name || item.user?.name || item.nickname || '-'}
              </span>
              <span className='text-primary font-semibold'>
                {item.correctCount ?? 0}회 적중
              </span>
            </div>
          ))}
          {(!data || data.length === 0) && (
            <EmptyState
              icon='Medal'
              title='랭킹 데이터가 없습니다'
              description='예측 적중 기록이 쌓이면 랭킹이 표시됩니다.'
            />
          )}
        </div>
      )}
    </Layout>
  );
}
