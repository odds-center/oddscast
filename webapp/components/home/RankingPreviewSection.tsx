/**
 * Ranking preview section — TOP 5
 */
import { useQuery } from '@tanstack/react-query';
import RankingApi, { type RankingUser } from '@/lib/api/rankingApi';
import HomeSection from './HomeSection';
import { RankBadge } from '@/components/ui';
import { routes } from '@/lib/routes';

const RANK_COLORS: Record<number, string> = {
  1: 'text-primary',
  2: 'text-stone-600',
  3: 'text-stone-400',
};

export default function RankingPreviewSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['rankings', 'preview'],
    queryFn: () => RankingApi.getRankings({ limit: 5 }),
  });

  const items: RankingUser[] = Array.isArray(data)
    ? data
    : data != null && typeof data === 'object' && 'data' in data
      ? (Array.isArray((data as { data?: RankingUser[] }).data) ? (data as { data: RankingUser[] }).data : [])
      : [];

  return (
    <HomeSection
      title='예측 랭킹'
      icon='Medal'
      viewAllHref={routes.ranking}
      viewAllLabel='더보기'
      accent
    >
      {isLoading ? (
        <div className='py-8 text-center text-text-secondary text-sm'>랭킹 준비 중...</div>
      ) : items.length === 0 ? (
        <div className='py-8 text-center text-text-secondary text-sm'>랭킹 정보가 없습니다.</div>
      ) : (
        <ul className='divide-y divide-border'>
          {items.map((item, idx) => {
            const rank = idx + 1;
            const name = item.name ?? '-';
            const correctCount = (item as RankingUser & { correctCount?: number }).correctCount ?? 0;
            const rankEl =
              rank <= 3 ? (
                <RankBadge rank={String(rank) as '1' | '2' | '3'} />
              ) : (
                <span className='inline-flex items-center justify-center min-w-[28px] text-sm font-bold text-text-tertiary'>{rank}</span>
              );
            return (
              <li key={item.id} className='flex items-center gap-3 py-2 first:pt-0 last:pb-0'>
                {rankEl}
                <span className={`font-medium flex-1 truncate ${RANK_COLORS[rank] ?? 'text-foreground'}`}>{name}</span>
                <span className='text-stone-700 font-semibold shrink-0'>{correctCount}회 적중</span>
              </li>
            );
          })}
        </ul>
      )}
    </HomeSection>
  );
}
