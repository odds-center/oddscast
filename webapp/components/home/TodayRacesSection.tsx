/**
 * 오늘의 경주 섹션 — RaceApi.getTodayRaces 기반
 */
import { useQuery } from '@tanstack/react-query';
import RaceApi from '@/lib/api/raceApi';
import RaceCard from '@/components/RaceCard';
import HomeSection from './HomeSection';
import { routes } from '@/lib/routes';
import type { RaceDto } from '@/lib/types/race';

export default function TodayRacesSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['races', 'today'],
    queryFn: async () => {
      const res = await RaceApi.getRaces({
        limit: 8,
        page: 1,
        date: 'today',
      });
      return res?.races ?? [];
    },
  });

  const races = (data ?? []) as RaceDto[];

  return (
    <HomeSection
      title='오늘의 경주'
      icon='Flag'
      viewAllHref={`${routes.races.list}?date=today`}
      viewAllLabel='전체보기'
    >
      {isLoading ? (
        <div className='py-8 text-center text-text-secondary text-sm'>경주 정보를 불러오는 중...</div>
      ) : races.length === 0 ? (
        <div className='py-8 text-center text-text-secondary text-sm'>오늘 예정된 경주가 없습니다.</div>
      ) : (
        <div className='flex flex-col gap-3'>
          {races.slice(0, 3).map((race) => (
            <RaceCard key={race.id} race={race} />
          ))}
        </div>
      )}
    </HomeSection>
  );
}
