/**
 * Home quick stats — race information bar
 */
import Link from 'next/link';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import RaceApi from '@/lib/api/raceApi';
import { routes } from '@/lib/routes';
import { getTodayKstDate } from '@/lib/utils/format';
import Icon from '@/components/icons';
import type { RaceDto } from '@/lib/types/race';

function getWeekRange(): { dateFrom: string; dateTo: string } {
  const kst = getTodayKstDate();
  const from = new Date(Date.UTC(kst.year, kst.month - 1, kst.day));
  const to = new Date(Date.UTC(kst.year, kst.month - 1, kst.day + 6));
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  return { dateFrom: fmt(from), dateTo: fmt(to) };
}

function groupByMeet(races: { meet?: string; meetName?: string }[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const r of races) {
    const name = r.meetName ?? r.meet ?? '기타';
    map[name] = (map[name] ?? 0) + 1;
  }
  return map;
}

export default function HomeQuickStats() {
  const { data: todayData } = useQuery({
    queryKey: ['races', 'today', 'stats'],
    queryFn: () => RaceApi.getRaces({ limit: 100, page: 1, date: 'today' }),
    placeholderData: keepPreviousData,
  });

  // Reuse same cache key as WeekRacesSection — no duplicate fetch
  const { data: weekRaces } = useQuery({
    queryKey: ['races', 'week'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { dateFrom, dateTo } = getWeekRange();
      const res = await RaceApi.getRaces({ limit: 50, page: 1, dateFrom, dateTo });
      return (res?.races ?? []) as RaceDto[];
    },
  });

  const todayRaces = todayData?.races ?? [];
  const todayCount = todayData?.total ?? todayRaces.length;
  const weekCount = weekRaces?.length ?? 0;
  const meetCounts = groupByMeet(todayRaces);

  return (
    <div className='flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs'>
      {todayCount > 0 ? (
        <Link
          href={`${routes.races.list}?date=today`}
          className='inline-flex items-center gap-1.5 font-semibold text-primary hover:underline whitespace-nowrap'
        >
          <Icon name='Flag' size={13} />
          오늘 {todayCount}경
        </Link>
      ) : (
        <span className='inline-flex items-center gap-1.5 text-stone-600 whitespace-nowrap'>
          <Icon name='Flag' size={13} />
          오늘 경주 없음
        </span>
      )}
      <span className='w-px h-3 bg-stone-200' />
      {weekCount > 0 && (
        <Link
          href={routes.races.list}
          className='text-stone-700 hover:text-foreground transition-colors whitespace-nowrap'
        >
          금주 <span className='font-semibold'>{weekCount}경</span>
        </Link>
      )}
      {todayCount > 0 && Object.keys(meetCounts).length > 0 && (
        <>
          <span className='w-px h-3 bg-stone-200' />
          {Object.entries(meetCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([meet, cnt]) => (
              <Link
                key={meet}
                href={`${routes.races.list}?date=today&meet=${encodeURIComponent(meet)}`}
                className='text-stone-700 hover:text-foreground transition-colors whitespace-nowrap'
              >
                {meet} {cnt}경
              </Link>
            ))}
        </>
      )}
    </div>
  );
}
