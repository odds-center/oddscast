/**
 * 홈 상단 퀵 스탯 — 오늘/이번주 경주 요약
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

export default function HomeQuickStats() {
  const { data: todayData } = useQuery({
    queryKey: ['races', 'today', 'count'],
    queryFn: () => RaceApi.getRaces({ limit: 1, page: 1, date: 'today' }),
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

  const todayCount = todayData?.total ?? 0;
  const weekCount = weekData?.total ?? 0;

  if (todayCount === 0 && weekCount === 0) return null;

  const allItems: { href: string; label: string; count: number; icon: 'Flag' | 'Calendar' }[] = [
    { href: `${routes.races.list}?date=today`, label: '오늘', count: todayCount, icon: 'Flag' },
    { href: routes.races.list, label: '이번 주', count: weekCount, icon: 'Calendar' },
  ];
  const items = allItems.filter((i) => i.count > 0);

  if (items.length === 0) return null;

  return (
    <div className='flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-5'>
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className='inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-slate-300 hover:bg-slate-50 transition-colors'
        >
          <Icon name={item.icon} size={16} className='text-slate-500 shrink-0' />
          <span className='text-text-secondary text-sm'>{item.label}</span>
          <span className='font-semibold text-foreground'>{item.count}경</span>
        </Link>
      ))}
    </div>
  );
}
