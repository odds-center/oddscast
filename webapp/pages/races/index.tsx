/**
 * All races list — filters (date, status, region) + table + pagination
 * FEATURE_ROADMAP 5.2: favorite meet filter saved per user when logged in
 */
import { useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import FilterDateBar from '@/components/page/FilterDateBar';
import Pagination from '@/components/page/Pagination';
import DataFetchState from '@/components/page/DataFetchState';
import { DataTable, LinkBadge, StatusBadge } from '@/components/ui';
import RaceApi from '@/lib/api/raceApi';
import AuthApi from '@/lib/api/authApi';
import { routes } from '@/lib/routes';
import { TODAY_ALL_ENDED_MESSAGE } from '@/lib/utils/dateHeaderMessages';
import { formatRcDate, getTodayKstDate, isRaceActuallyEnded } from '@/lib/utils/format';
import type { RaceDto } from '@/lib/types/race';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import type { GetStaticProps } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { serverGet } from '@/lib/api/serverFetch';

/** ISR revalidate interval (seconds) for race list */
const REVALIDATE_RACES = 60;

const RACES_PER_PAGE = 20;
const RACE_DAYS = [5, 6, 0]; // Fri, Sat, Sun (KST)
const LIVE_REFETCH_MS = 5 * 60 * 1000;

function parseDateFilter(qDate: string | undefined): string {
  if (qDate === 'today' || qDate === 'yesterday') return qDate;
  if (qDate && /^\d{4}-?\d{2}-?\d{2}$/.test(qDate.replace(/-/g, ''))) {
    return qDate.includes('-') ? qDate : `${qDate.slice(0, 4)}-${qDate.slice(4, 6)}-${qDate.slice(6, 8)}`;
  }
  return '';
}

/** API date param: send 'today'/'yesterday' so server resolves in KST; otherwise YYYYMMDD. */
function dateToApiParam(dateFilter: string): string | undefined {
  if (dateFilter === 'today' || dateFilter === 'yesterday') return dateFilter;
  if (dateFilter) return dateFilter.replace(/-/g, '');
  return undefined;
}

export default function RacesListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const qDate = router.query?.date as string | undefined;
  const qMeet = (router.query?.meet as string) || '';
  const qStatus = (router.query?.status as string) || '';
  const dateFilter = parseDateFilter(qDate);
  const page = Math.max(1, parseInt(String(router.query?.page ?? 1), 10) || 1);
  const hasAppliedFavoriteMeet = useRef(false);

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
  }, [isLoggedIn, currentUser, qMeet, router]);

  const updateQuery = (updates: Record<string, string | number | undefined>) => {
    const next = { ...router.query, ...updates };
    Object.keys(updates).forEach((k) => {
      if (updates[k] === undefined || updates[k] === '') delete next[k];
    });
    router.replace({ pathname: router.pathname, query: next }, undefined, { shallow: true });
  };

  const { weekDay } = getTodayKstDate();
  const isTodayRaceDay = dateFilter === 'today' && RACE_DAYS.includes(weekDay);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['races', 'list', dateFilter, qMeet, qStatus, page],
    placeholderData: keepPreviousData,
    refetchInterval: isTodayRaceDay ? LIVE_REFETCH_MS : false,
    queryFn: () => {
      const date = dateToApiParam(dateFilter);
      return RaceApi.getRaces({
        limit: RACES_PER_PAGE,
        page,
        ...(date && { date }),
        ...(qMeet && { meet: qMeet }),
      });
    },
  });

  const filteredRaces = useMemo(() => {
    const races = data?.races ?? [];
    if (!qStatus) return races;
    return races.filter((race) => {
      const s = race.status || (race as RaceDto & { raceStatus?: string }).raceStatus || '';
      const isCompleted = s.toUpperCase() === 'COMPLETED';
      if (qStatus === 'COMPLETED') return isCompleted;
      if (qStatus === 'SCHEDULED') return !isCompleted;
      return true;
    });
  }, [data?.races, qStatus]);

  const todayRacesAllEnded =
    dateFilter === 'today' &&
    (data?.races?.length ?? 0) > 0 &&
    (data?.races ?? []).every(
      (race: RaceDto) =>
        (race.status ?? (race as RaceDto & { raceStatus?: string }).raceStatus) === 'COMPLETED' &&
        isRaceActuallyEnded(race.rcDate, race.stTime),
    );

  return (
    <Layout title='전체 경주 | OddsCast'>
      <CompactPageTitle title='전체 경주' backHref={routes.home} />
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
        dateId='races-list-date'
        showStatusFilter
        statusValue={qStatus}
        onStatusChange={(v) => updateQuery({ status: v || undefined, page: 1 })}
        showMeetFilter
        meetValue={qMeet}
        onMeetChange={(v) => {
          updateQuery({ meet: v || undefined, page: 1 });
          if (isLoggedIn) {
            updateProfileMutation.mutate(v || null);
          }
        }}
      />

      <DataFetchState
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        isEmpty={!filteredRaces.length}
        emptyIcon='Flag'
        emptyTitle='경주가 없습니다'
        emptyDescription='다른 날짜나 조건을 선택해보세요.'
        loadingLabel='경주 정보 준비 중...'
        errorTitle='경주 정보를 확인할 수 없습니다'
      >
        {todayRacesAllEnded && (
          <div className='mb-4 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-text-secondary'>
            {TODAY_ALL_ENDED_MESSAGE}
          </div>
        )}
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
              key: 'dist',
              header: '거리',
              headerClassName: 'w-16 whitespace-nowrap',
              cellClassName: 'whitespace-nowrap',
              render: (race) =>
                race.rcDist ? (
                  <span className='text-text-secondary'>{race.rcDist}m</span>
                ) : (
                  <span className='text-text-tertiary'>-</span>
                ),
            },
            {
              key: 'start',
              header: '출발',
              headerClassName: 'w-16 whitespace-nowrap',
              cellClassName: 'whitespace-nowrap',
              render: (race) => {
                const st = race.stTime ?? (race as RaceDto & { rcStartTime?: string }).rcStartTime;
                return <span className='text-text-secondary'>{st || '-'}</span>;
              },
            },
            {
              key: 'entries',
              header: '두수',
              headerClassName: 'w-14 whitespace-nowrap',
              cellClassName: 'whitespace-nowrap',
              align: 'center',
              render: (race) => {
                const r = race as RaceDto & {
                  entries?: { hrName?: string }[];
                  entryDetails?: { hrName?: string }[];
                };
                const count = (r.entries ?? r.entryDetails ?? []).length;
                return <span className='text-text-secondary'>{count > 0 ? `${count}두` : '-'}</span>;
              },
            },
            {
              key: 'status',
              header: '상태',
              headerClassName: 'w-16 whitespace-nowrap',
              cellClassName: 'whitespace-nowrap',
              render: (race) => (
                <StatusBadge
                  status={race.status || (race as RaceDto & { raceStatus?: string }).raceStatus || '-'}
                  rcDate={race.rcDate}
                  stTime={race.stTime}
                />
              ),
            },
          ]}
          data={filteredRaces}
          getRowKey={(race) => race.id}
          getRowHref={(race) => routes.races.detail(race.id)}
          className='data-table-kra'
          compact
        />
        <Pagination
          page={page}
          totalPages={data?.totalPages ?? 1}
          onPageChange={(p) => updateQuery({ page: p })}
          className='mt-3'
        />
      </DataFetchState>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const queryClient = new QueryClient();
  const dateFilter = ''; // default when no query (client: parseDateFilter(undefined) => '')
  const date = dateToApiParam(dateFilter);
  const page = 1;
  const qMeet = '';
  const qStatus = '';
  try {
    const params: Record<string, string | number> = { limit: RACES_PER_PAGE, page };
    if (date) params.date = date;
    await queryClient.prefetchQuery({
      queryKey: ['races', 'list', dateFilter, qMeet, qStatus, page],
      queryFn: () => serverGet<{ races?: unknown[]; totalPages?: number }>('/races', { params }),
    });
  } catch {
    // Fetch on client if SSR fails
  }
  return { props: { dehydratedState: dehydrate(queryClient) }, revalidate: REVALIDATE_RACES };
};
