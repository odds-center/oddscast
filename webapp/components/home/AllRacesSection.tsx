/**
 * 전체 경주 미리보기 섹션 — 필터 + 소수 항목만 (페이지네이션 없음)
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import RaceApi from '@/lib/api/raceApi';
import RaceCard from '@/components/RaceCard';
import HomeSection from './HomeSection';
import FilterDateBar from '@/components/page/FilterDateBar';
import { routes } from '@/lib/routes';
import DataFetchState from '@/components/page/DataFetchState';
import type { RaceDto } from '@/lib/types/race';

const PREVIEW_LIMIT = 5;

export default function AllRacesSection() {
  const router = useRouter();
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    const q = router.query?.date as string | undefined;
    if (q === 'today') setDateFilter('today');
    else if (q && /^\d{4}-?\d{2}-?\d{2}$/.test(q.replace(/-/g, ''))) {
      const normalized = q.includes('-') ? q : `${q.slice(0, 4)}-${q.slice(4, 6)}-${q.slice(6, 8)}`;
      setDateFilter(normalized);
    }
  }, [router.query?.date]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['races', 'all', dateFilter],
    queryFn: () => {
      const date =
        dateFilter === 'today' ? new Date().toISOString().slice(0, 10).replace(/-/g, '') : dateFilter;
      return RaceApi.getRaces({
        limit: PREVIEW_LIMIT,
        page: 1,
        ...(date && { date }),
      });
    },
  });

  const races = (data?.races ?? []) as RaceDto[];

  return (
    <HomeSection title='전체 경주' icon='ClipboardList' viewAllHref={routes.races.list} viewAllLabel='전체보기'>
      <FilterDateBar
        filterOptions={[
          { value: '', label: '전체' },
          { value: 'today', label: '오늘' },
        ]}
        filterValue={dateFilter === 'today' ? 'today' : dateFilter || ''}
        onFilterChange={(v) => setDateFilter(v)}
        dateValue={dateFilter && dateFilter !== 'today' ? dateFilter : ''}
        onDateChange={(v) => setDateFilter(v || '')}
        dateId='all-race-date'
        inline
      />

      <DataFetchState
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        isEmpty={!races.length}
        emptyIcon='Flag'
        emptyTitle='진행 중인 경주가 없습니다'
        emptyDescription='다른 날짜를 선택해주세요.'
        loadingLabel='경주 정보를 불러오는 중...'
        errorTitle='경주 정보를 불러오지 못했습니다'
      >
        <div className='flex flex-col gap-3'>
          {races.map((race) => (
            <RaceCard key={race.id} race={race} />
          ))}
        </div>
      </DataFetchState>
    </HomeSection>
  );
}
