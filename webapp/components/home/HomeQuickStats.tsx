/**
 * 홈 퀵 스탯 — 경주 정보 바
 */
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import RaceApi from '@/lib/api/raceApi';
import { routes } from '@/lib/routes';
import Icon from '@/components/icons';

function getWeekDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
  }
  return dates;
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
  });

  const { data: weekData } = useQuery({
    queryKey: ['races', 'week', 'count'],
    queryFn: async () => {
      const res = await RaceApi.getRaces({ limit: 150, page: 1 });
      const races = res?.races ?? [];
      const weekDates = getWeekDates();
      const weekRaces = races.filter((r: { rcDate?: string }) => {
        const d = (r.rcDate ?? '').replace(/-/g, '').slice(0, 8);
        return weekDates.some((wd) => d === wd);
      });
      return { total: weekRaces.length };
    },
  });

  const todayRaces = todayData?.races ?? [];
  const todayCount = todayData?.total ?? todayRaces.length;
  const weekCount = weekData?.total ?? 0;
  const meetCounts = groupByMeet(todayRaces);

  return (
    <div className='flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs'>
      {todayCount > 0 ? (
        <Link
          href={`${routes.races.list}?date=today`}
          className='inline-flex items-center gap-1.5 font-semibold text-[#92702A] hover:underline whitespace-nowrap'
        >
          <Icon name='Flag' size={13} />
          오늘 {todayCount}경
        </Link>
      ) : (
        <span className='inline-flex items-center gap-1.5 text-stone-400 whitespace-nowrap'>
          <Icon name='Flag' size={13} />
          오늘 경주 없음
        </span>
      )}
      <span className='w-px h-3 bg-stone-200' />
      {weekCount > 0 && (
        <Link
          href={routes.races.list}
          className='text-stone-500 hover:text-foreground transition-colors whitespace-nowrap'
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
                className='text-stone-500 hover:text-foreground transition-colors whitespace-nowrap'
              >
                {meet} {cnt}경
              </Link>
            ))}
        </>
      )}
    </div>
  );
}
