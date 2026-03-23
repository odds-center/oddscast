/**
 * Races — unified view showing schedule for upcoming races and
 * inline results for completed races. No separate tabs.
 */
import { useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import FilterDateBar from '@/components/page/FilterDateBar';
import Pagination from '@/components/page/Pagination';
import DataFetchState from '@/components/page/DataFetchState';
import { DataTable, LinkBadge, StatusBadge } from '@/components/ui';
import RaceApi from '@/lib/api/raceApi';
import ResultApi from '@/lib/api/resultApi';
import AuthApi from '@/lib/api/authApi';
import { routes } from '@/lib/routes';
import { TODAY_ALL_ENDED_MESSAGE } from '@/lib/utils/dateHeaderMessages';
import { formatRcDate, getTodayKstDate, isRaceActuallyEnded } from '@/lib/utils/format';
import type { RaceDto } from '@/lib/types/race';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
const RACES_PER_PAGE = 20;
const RACE_DAYS = [5, 6, 0]; // Fri, Sat, Sun (KST)
const LIVE_REFETCH_MS = 5 * 60 * 1000;

interface InlineResult {
  ord: string;
  chulNo?: string;
  hrNo: string;
  hrName: string;
  jkName: string;
}

function parseDateFilter(qDate: string | undefined): string {
  if (qDate === 'today' || qDate === 'yesterday') return qDate;
  if (qDate && /^\d{4}-?\d{2}-?\d{2}$/.test(qDate.replace(/-/g, ''))) {
    return qDate.includes('-') ? qDate : `${qDate.slice(0, 4)}-${qDate.slice(4, 6)}-${qDate.slice(6, 8)}`;
  }
  return '';
}

function dateToScheduleParam(dateFilter: string): string | undefined {
  if (dateFilter === 'today' || dateFilter === 'yesterday') return dateFilter;
  if (dateFilter) return dateFilter.replace(/-/g, '');
  return undefined;
}

function dateToResultParam(dateFilter: string): string | undefined {
  if (dateFilter === 'today') {
    const kst = getTodayKstDate();
    return `${kst.year}${String(kst.month).padStart(2, '0')}${String(kst.day).padStart(2, '0')}`;
  }
  if (dateFilter === 'yesterday') {
    const kst = getTodayKstDate();
    // Use Date with UTC to correctly handle month boundaries
    const d = new Date(Date.UTC(kst.year, kst.month - 1, kst.day));
    d.setUTCDate(d.getUTCDate() - 1);
    return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  }
  if (dateFilter) return dateFilter.replace(/-/g, '');
  return undefined;
}

export default function RacesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const qDate = router.query?.date as string | undefined;
  const qMeet = (router.query?.meet as string) || '';
  const dateFilter = parseDateFilter(qDate);
  const page = Math.max(1, parseInt(String(router.query?.page ?? 1), 10) || 1);
  const hasAppliedFavoriteMeet = useRef(false);

  const updateQuery = (updates: Record<string, string | number | undefined>) => {
    const next = { ...router.query, ...updates };
    Object.keys(updates).forEach((k) => {
      if (updates[k] === undefined || updates[k] === '') delete next[k];
    });
    delete next['view']; // remove any legacy view param
    router.replace({ pathname: router.pathname, query: next }, undefined, { shallow: true });
  };

  const { data: currentUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => AuthApi.getCurrentUser(),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (favoriteMeet: string | null) =>
      AuthApi.updateProfile({ favoriteMeet: favoriteMeet ?? undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  useEffect(() => {
    if (!isLoggedIn || hasAppliedFavoriteMeet.current || qMeet) return;
    const fav = (currentUser as { favoriteMeet?: string | null })?.favoriteMeet;
    if (fav && ['서울', '제주', '부산경남'].includes(fav)) {
      hasAppliedFavoriteMeet.current = true;
      router.replace(
        { pathname: router.pathname, query: { ...router.query, meet: fav } },
        undefined,
        { shallow: true },
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, currentUser, qMeet]);

  const { weekDay } = getTodayKstDate();
  const isTodayRaceDay = dateFilter === 'today' && RACE_DAYS.includes(weekDay);

  // Primary: paginated races list
  const { data: scheduleData, isLoading, error, refetch } = useQuery({
    queryKey: ['races', 'list', dateFilter, qMeet, page],
    placeholderData: keepPreviousData,
    refetchInterval: isTodayRaceDay ? LIVE_REFETCH_MS : false,
    queryFn: () => {
      const date = dateToScheduleParam(dateFilter);
      return RaceApi.getRaces({
        limit: RACES_PER_PAGE,
        page,
        ...(date && { date }),
        ...(qMeet && { meet: qMeet }),
      });
    },
  });

  // Secondary: results for same filter — used to show inline results on completed races
  const { data: resultsData } = useQuery({
    queryKey: ['results', 'grouped', 'inline', dateFilter, qMeet],
    placeholderData: keepPreviousData,
    queryFn: () => {
      const date = dateToResultParam(dateFilter);
      return ResultApi.getResultsGroupedByRace({
        limit: 100,
        page: 1,
        ...(date && { date }),
        ...(qMeet && { meet: qMeet }),
      });
    },
  });

  const races = scheduleData?.races ?? [];

  // Map raceId → top3 results for quick lookup
  const resultsByRaceId = useMemo(() => {
    const map = new Map<string, InlineResult[]>();
    for (const g of resultsData?.raceGroups ?? []) {
      map.set(
        g.race.id,
        (g.results ?? [])
          .filter((r) => ['1', '2', '3'].includes(r.ord ?? ''))
          .map((r) => ({
            ord: r.ord ?? '',
            chulNo: r.chulNo,
            hrNo: r.hrNo,
            hrName: r.hrName,
            jkName: r.jkName,
          })),
      );
    }
    return map;
  }, [resultsData?.raceGroups]);

  function getRaceStatus(race: RaceDto): string {
    return race.status ?? (race as RaceDto & { raceStatus?: string }).raceStatus ?? '';
  }

  const todayRacesAllEnded =
    dateFilter === 'today' &&
    races.length > 0 &&
    races.every(
      (race: RaceDto) =>
        getRaceStatus(race) === 'COMPLETED' && isRaceActuallyEnded(race.rcDate, race.stTime),
    );

  function raceIsCompleted(race: RaceDto): boolean {
    const s = getRaceStatus(race);
    return s === 'COMPLETED' || isRaceActuallyEnded(race.rcDate, race.stTime);
  }

  return (
    <Layout title='경주 | OddsCast' description='서울, 부산, 제주 경마장 경주 일정과 출전마 정보를 확인하세요.'>
      <CompactPageTitle title='경주' backHref={routes.home} />
      <FilterDateBar
        filterOptions={[
          { value: '', label: '전체' },
          { value: 'today', label: '오늘' },
          { value: 'yesterday', label: '어제' },
        ]}
        filterValue={
          dateFilter === 'today' ? 'today' : dateFilter === 'yesterday' ? 'yesterday' : dateFilter || ''
        }
        onFilterChange={(v) => updateQuery({ date: v || undefined, page: 1 })}
        dateValue={
          dateFilter && dateFilter !== 'today' && dateFilter !== 'yesterday'
            ? dateFilter.includes('-')
              ? dateFilter
              : `${dateFilter.slice(0, 4)}-${dateFilter.slice(4, 6)}-${dateFilter.slice(6, 8)}`
            : ''
        }
        onDateChange={(v) => updateQuery({ date: v || undefined, page: 1 })}
        dateId='races-date'
        showMeetFilter
        meetValue={qMeet}
        onMeetChange={(v) => {
          updateQuery({ meet: v || undefined, page: 1 });
          if (isLoggedIn) updateProfileMutation.mutate(v || null);
        }}
      />

      <DataFetchState
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!races.length}
        emptyIcon='Flag'
        emptyTitle='경주가 없습니다'
        emptyDescription='다른 날짜나 조건을 선택해보세요.'
        loadingLabel='경주 정보 준비 중...'
        errorTitle='경주 정보를 확인할 수 없습니다'
      >
        {todayRacesAllEnded && (
          <div className='mb-4 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-text-secondary whitespace-pre-line'>
            {TODAY_ALL_ENDED_MESSAGE}
          </div>
        )}

        {/* Mobile: card list */}
        <div className='block lg:hidden space-y-2'>
          {races.map((race) => {
            const completed = raceIsCompleted(race);
            const raceResults = resultsByRaceId.get(race.id) ?? [];
            const showResults = completed && raceResults.length > 0;
            const raceStatus = getRaceStatus(race);
            return (
              <Link
                key={race.id}
                href={routes.races.detail(race.id)}
                className='block rounded-md border border-stone-200 bg-white p-3 hover:bg-stone-50 transition-colors'
              >
                <div className='flex items-center justify-between mb-1.5'>
                  <span className='font-semibold text-foreground text-sm'>
                    {race.meetName ?? '-'} {race.rcNo}R
                  </span>
                  <span className='text-text-tertiary text-xs'>{formatRcDate(race.rcDate)}</span>
                </div>
                {showResults ? (
                  <div className='flex items-center gap-3 text-xs flex-wrap'>
                    {(['1', '2', '3'] as const).map((ord) => {
                      const r = raceResults.find((x) => x.ord === ord);
                      const cls =
                        ord === '1'
                          ? 'text-primary font-bold'
                          : ord === '2'
                            ? 'text-stone-600 font-semibold'
                            : 'text-stone-500 font-semibold';
                      return (
                        <span key={ord} className='inline-flex items-center gap-0.5'>
                          <span className={`text-xs ${cls}`}>{ord}위</span>
                          <span className='font-medium text-foreground'>
                            {r ? r.hrName : '-'}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className='flex items-center gap-2 text-xs text-text-secondary flex-wrap'>
                    {race.stTime && <span>{race.stTime}</span>}
                    {race.rcDist && <span>{race.rcDist}m</span>}
                    <StatusBadge status={raceStatus} rcDate={race.rcDate} stTime={race.stTime} />
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop: table */}
        <div className='hidden lg:block'>
          <DataTable
            columns={[
              {
                key: 'race',
                header: '경주',
                headerClassName: 'w-28 whitespace-nowrap',
                cellClassName: 'whitespace-nowrap',
                render: (race) => (
                  <LinkBadge href={routes.races.detail(race.id)} icon='Flag' iconSize={13}>
                    {race.meetName ?? '-'} {race.rcNo}R
                  </LinkBadge>
                ),
              },
              {
                key: 'date',
                header: '날짜',
                headerClassName: 'w-24 whitespace-nowrap',
                cellClassName: 'whitespace-nowrap',
                render: (race) => (
                  <span className='text-text-secondary'>{formatRcDate(race.rcDate)}</span>
                ),
              },
              {
                key: 'info',
                header: '결과 / 정보',
                headerClassName: 'min-w-[220px]',
                render: (race) => {
                  const completed = raceIsCompleted(race);
                  const raceResults = resultsByRaceId.get(race.id) ?? [];
                  const raceStatus = getRaceStatus(race);
                  if (completed && raceResults.length > 0) {
                    return (
                      <span className='inline-flex items-center gap-4 text-sm'>
                        {(['1', '2', '3'] as const).map((ord) => {
                          const r = raceResults.find((x) => x.ord === ord);
                          if (!r) return null;
                          return (
                            <span key={ord} className='inline-flex items-center gap-1 whitespace-nowrap'>
                              <span className='text-text-tertiary text-xs'>{ord}위</span>
                              <span className='font-medium text-foreground'>{r.hrName}</span>
                              <span className='text-text-tertiary text-xs'>({r.jkName})</span>
                            </span>
                          );
                        })}
                      </span>
                    );
                  }
                  return (
                    <span className='inline-flex items-center gap-2 text-sm text-text-secondary'>
                      {race.stTime && <span>{race.stTime}</span>}
                      {race.rcDist && <span className='text-text-tertiary'>{race.rcDist}m</span>}
                      <StatusBadge status={raceStatus} rcDate={race.rcDate} stTime={race.stTime} />
                    </span>
                  );
                },
              },
            ]}
            data={races}
            getRowKey={(race) => race.id}
            getRowHref={(race) => routes.races.detail(race.id)}
            className=''
            compact
          />
        </div>

        <Pagination
          page={page}
          totalPages={scheduleData?.totalPages ?? 1}
          onPageChange={(p) => updateQuery({ page: p })}
          className='mt-3'
        />
      </DataFetchState>
    </Layout>
  );
}

