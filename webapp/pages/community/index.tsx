import { useState } from 'react';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import DataFetchState from '@/components/page/DataFetchState';
import TabBar from '@/components/ui/TabBar';
import type { TabOption } from '@/components/ui/TabBar';
import Icon from '@/components/icons';
import { Button } from '@/components/ui/button';
import CommunityPredictionsApi from '@/lib/api/communityPredictionsApi';
import type { LeaderboardPeriod, LeaderboardEntry } from '@/lib/api/communityPredictionsApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { routes } from '@/lib/routes';

const PERIOD_OPTIONS: TabOption<LeaderboardPeriod>[] = [
  { value: 'weekly', label: '주간' },
  { value: 'monthly', label: '월간' },
  { value: 'alltime', label: '전체' },
];

/** Medal icon + color class for top-3 ranks */
function rankMeta(rank: number): { color: string; bg: string } {
  if (rank === 1) return { color: 'text-amber-600', bg: 'bg-amber-50' };
  if (rank === 2) return { color: 'text-stone-500', bg: 'bg-stone-100' };
  if (rank === 3) return { color: 'text-orange-600', bg: 'bg-orange-50' };
  return { color: 'text-text-secondary', bg: 'bg-transparent' };
}

function RankCell({ rank }: { rank: number }) {
  const meta = rankMeta(rank);
  if (rank <= 3) {
    return (
      <span
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${meta.bg} ${meta.color}`}
      >
        {rank}
      </span>
    );
  }
  return (
    <span className='tabular-nums text-sm text-text-secondary text-right w-8 inline-block'>
      {rank}
    </span>
  );
}

function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 ${
        isMe ? 'bg-primary/5 border-l-2 border-l-primary' : ''
      }`}
    >
      <div className='shrink-0 w-8 flex items-center justify-center'>
        <RankCell rank={entry.rank} />
      </div>

      <div className='flex-1 min-w-0'>
        <p className={`text-sm font-semibold truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
          {entry.username}
          {isMe && (
            <span className='ml-1.5 text-xs font-normal text-primary'>(나)</span>
          )}
        </p>
        <p className='text-xs text-text-tertiary mt-0.5'>
          예측 {entry.predictionCount}회
          {entry.perfectPredictions > 0 && (
            <span className='ml-1.5 text-amber-600 font-medium'>
              완벽 {entry.perfectPredictions}회
            </span>
          )}
        </p>
      </div>

      <div className='text-right shrink-0'>
        <p className='text-base font-bold text-foreground tabular-nums'>
          {entry.totalScore.toLocaleString('ko-KR')}
        </p>
        <p className='text-xs text-text-tertiary'>점</p>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['community-leaderboard', period],
    queryFn: () => CommunityPredictionsApi.getLeaderboard(period),
  });

  const entries = data?.entries ?? [];

  return (
    <Layout
      title='커뮤니티 예측 | OddsCast'
      description='커뮤니티 예측 리더보드 — 경주 예측 점수를 겨뤄보세요.'
    >
      <CompactPageTitle title='커뮤니티 예측' backHref={routes.home} />

      <p className='text-sm text-text-secondary mb-4'>
        경주 결과를 예측하고 랭킹을 경쟁해 보세요. 정확한 예측일수록 높은 점수를 얻습니다.
      </p>

      {/* My predictions shortcut */}
      {isLoggedIn && (
        <div className='mb-4'>
          <Button asChild variant='outline' size='sm'>
            <Link href={routes.community.myPredictions}>
              <Icon name='ListChecks' size={16} />
              내 예측 보기
            </Link>
          </Button>
        </div>
      )}

      {/* Period tab switcher */}
      <TabBar<LeaderboardPeriod>
        options={PERIOD_OPTIONS}
        value={period}
        onChange={setPeriod}
        variant='subtle'
        size='sm'
        className='mb-5'
      />

      <DataFetchState
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        isEmpty={entries.length === 0}
        emptyIcon='Trophy'
        emptyTitle='아직 순위가 없습니다'
        emptyDescription={'첫 번째 예측을 제출하고\n리더보드에 이름을 올려보세요.'}
        loadingLabel='순위 불러오는 중...'
        errorTitle='순위를 불러오지 못했습니다'
        errorDescription='잠시 후 다시 시도해 주세요.'
      >
        <div className='rounded-xl border border-border bg-card overflow-hidden shadow-sm'>
          {/* Top 3 podium highlight */}
          {entries.length >= 3 && (
            <div className='grid grid-cols-3 gap-3 p-4 border-b border-border bg-stone-50/60'>
              {/* 2nd place */}
              <div className='flex flex-col items-center gap-1 pt-3'>
                <div className='w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-base'>
                  2
                </div>
                <p className='text-xs font-semibold text-foreground truncate max-w-full text-center px-1'>
                  {entries[1]?.username ?? '-'}
                </p>
                <p className='text-xs text-text-tertiary tabular-nums'>
                  {(entries[1]?.totalScore ?? 0).toLocaleString('ko-KR')}점
                </p>
              </div>
              {/* 1st place */}
              <div className='flex flex-col items-center gap-1'>
                <div className='relative'>
                  <Icon name='Crown' size={18} className='text-amber-500 absolute -top-5 left-1/2 -translate-x-1/2' />
                  <div className='w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-400 flex items-center justify-center text-amber-600 font-bold text-lg'>
                    1
                  </div>
                </div>
                <p className='text-xs font-bold text-foreground truncate max-w-full text-center px-1 mt-1'>
                  {entries[0]?.username ?? '-'}
                </p>
                <p className='text-xs text-text-tertiary tabular-nums'>
                  {(entries[0]?.totalScore ?? 0).toLocaleString('ko-KR')}점
                </p>
              </div>
              {/* 3rd place */}
              <div className='flex flex-col items-center gap-1 pt-3'>
                <div className='w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-base'>
                  3
                </div>
                <p className='text-xs font-semibold text-foreground truncate max-w-full text-center px-1'>
                  {entries[2]?.username ?? '-'}
                </p>
                <p className='text-xs text-text-tertiary tabular-nums'>
                  {(entries[2]?.totalScore ?? 0).toLocaleString('ko-KR')}점
                </p>
              </div>
            </div>
          )}

          {/* Full list */}
          <div>
            {entries.map((entry) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                isMe={isLoggedIn && user?.id === String(entry.userId)}
              />
            ))}
          </div>

          {/* Footer: last updated */}
          {data?.generatedAt && (
            <div className='px-4 py-2 border-t border-border bg-stone-50/40'>
              <p className='text-xs text-text-tertiary text-right'>
                업데이트:{' '}
                {new Intl.DateTimeFormat('ko-KR', {
                  timeZone: 'Asia/Seoul',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(data.generatedAt))}
              </p>
            </div>
          )}
        </div>
      </DataFetchState>
    </Layout>
  );
}
