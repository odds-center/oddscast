/**
 * 랭킹 프리뷰 섹션 — TOP 5
 */
import { useQuery } from '@tanstack/react-query';
import RankingApi from '@/lib/api/rankingApi';
import HomeSection from './HomeSection';
import { RankBadge } from '@/components/ui';
import { routes } from '@/lib/routes';

const RANK_COLORS: Record<number, string> = {
  1: 'text-[#92702A]',
  2: 'text-stone-600',
  3: 'text-stone-400',
};

export default function RankingPreviewSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['rankings', 'preview'],
    queryFn: () => RankingApi.getRankings({ limit: 5 }),
  });

  const items = Array.isArray(data) ? data : ((data as { data?: unknown[] })?.data ?? []);

  return (
    <HomeSection
      title='예측 랭킹'
      icon='Medal'
      viewAllHref={routes.ranking}
      viewAllLabel='더보기'
      accent
    >
      {isLoading ? (
        <div className='py-8 text-center text-text-secondary text-sm'>랭킹을 불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className='py-8 text-center text-text-secondary text-sm'>랭킹 데이터가 없습니다.</div>
      ) : (
        <ul className='divide-y divide-border'>
          {items.map((item, idx) => {
            const rank = idx + 1;
            const name = item.name ?? (item as { user?: { name?: string }; nickname?: string }).user?.name ?? (item as { nickname?: string }).nickname ?? '-';
            const correctCount = (item as { correctCount?: number }).correctCount ?? 0;
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
