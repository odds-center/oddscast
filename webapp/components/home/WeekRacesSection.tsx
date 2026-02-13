/**
 * 금주의 경주 섹션 — 이번 주 경주 미리보기
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import RaceApi from '@/lib/api/raceApi';
import RaceCard from '@/components/RaceCard';
import HomeSection from './HomeSection';
import { routes } from '@/lib/routes';
import type { RaceDto } from '@/lib/types/race';

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

export default function WeekRacesSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['races', 'week'],
    queryFn: async () => {
      const res = await RaceApi.getRaces({ limit: 50, page: 1 });
      const races = (res?.races ?? []) as RaceDto[];
      const weekDates = getWeekDates();
      return races.filter((r) => {
        const d = (r.rcDate ?? '').replace(/-/g, '').slice(0, 8);
        return weekDates.some((wd) => d === wd);
      });
    },
  });

  const races = useMemo(() => (data ?? []).slice(0, 3), [data]);

  return (
    <HomeSection
      title='금주의 경주'
      icon='Calendar'
      viewAllHref={routes.races.list}
      viewAllLabel='전체보기'
    >
      {isLoading ? (
        <div className='py-8 text-center text-text-secondary text-sm'>경주 정보를 불러오는 중...</div>
      ) : races.length === 0 ? (
        <div className='py-8 text-center text-text-secondary text-sm'>이번 주 예정된 경주가 없습니다.</div>
      ) : (
        <div className='flex flex-col gap-3'>
          {races.map((race) => (
            <RaceCard key={race.id} race={race} />
          ))}
        </div>
      )}
    </HomeSection>
  );
}
