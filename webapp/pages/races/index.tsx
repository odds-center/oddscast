/**
 * 전체 경주 목록 페이지 — 필터 + 테이블 + 페이지네이션
 */
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import FilterDateBar from '@/components/page/FilterDateBar';
import Pagination from '@/components/page/Pagination';
import DataFetchState from '@/components/page/DataFetchState';
import { DataTable, LinkBadge, StatusBadge } from '@/components/ui';
import RaceApi from '@/lib/api/raceApi';
import { routes } from '@/lib/routes';
import { formatRcDate } from '@/lib/utils/format';
import type { RaceDto } from '@/lib/types/race';
import { useQuery } from '@tanstack/react-query';

const RACES_PER_PAGE = 20;

export default function RacesListPage() {
  const router = useRouter();
  const qDate = router.query?.date as string | undefined;
  const qMeet = (router.query?.meet as string) || '';
  const dateFilter =
    qDate === 'today'
      ? 'today'
      : qDate === 'yesterday'
        ? 'yesterday'
        : qDate && /^\d{4}-?\d{2}-?\d{2}$/.test(qDate.replace(/-/g, ''))
          ? qDate.includes('-')
            ? qDate
            : `${qDate.slice(0, 4)}-${qDate.slice(4, 6)}-${qDate.slice(6, 8)}`
          : '';
  const page = Math.max(1, parseInt(String(router.query?.page ?? 1), 10) || 1);

  const updateQuery = (updates: Record<string, string | number | undefined>) => {
    const next = { ...router.query, ...updates };
    Object.keys(updates).forEach((k) => {
      if (updates[k] === undefined || updates[k] === '') delete next[k];
    });
    router.replace({ pathname: router.pathname, query: next }, undefined, { shallow: true });
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['races', 'list', dateFilter, qMeet, page],
    queryFn: () => {
      let date: string | undefined;
      if (dateFilter === 'today') {
        date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      } else if (dateFilter === 'yesterday') {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        date = d.toISOString().slice(0, 10).replace(/-/g, '');
      } else if (dateFilter) {
        date = dateFilter.replace(/-/g, '');
      }
      return RaceApi.getRaces({
        limit: RACES_PER_PAGE,
        page,
        ...(date && { date }),
        ...(qMeet && { meet: qMeet }),
      });
    },
  });

  return (
    <Layout title='GOLDEN RACE'>
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
            : dateFilter === 'yesterday'
              ? (() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  return d.toISOString().slice(0, 10);
                })()
              : ''
        }
        onDateChange={(v) => updateQuery({ date: v || undefined, page: 1 })}
        dateId='races-list-date'
        showMeetFilter
        meetValue={qMeet}
        onMeetChange={(v) => updateQuery({ meet: v || undefined, page: 1 })}
      />

      <DataFetchState
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        isEmpty={!data?.races?.length}
        emptyIcon='Flag'
        emptyTitle='진행 중인 경주가 없습니다'
        emptyDescription='다른 날짜를 선택하거나 나중에 다시 확인해주세요.'
        loadingLabel='경주 정보를 불러오는 중...'
        errorTitle='경주 정보를 불러오지 못했습니다'
      >
        <DataTable
          columns={[
            {
              key: 'race',
              header: '경주',
              headerClassName: 'w-24 whitespace-nowrap',
              cellClassName: 'whitespace-nowrap',
              render: (race) => (
                <LinkBadge href={routes.races.detail(race.id)} icon='Flag' iconSize={14}>
                  {race.meetName ?? '-'} {race.rcNo}경
                </LinkBadge>
              ),
            },
            {
              key: 'date',
              header: '날짜',
              headerClassName: 'w-20 whitespace-nowrap',
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
                  <span className='badge-muted'>{race.rcDist}m</span>
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
                return st ? (
                  <span className='badge-muted'>{st}</span>
                ) : (
                  <span className='text-text-tertiary'>-</span>
                );
              },
            },
            {
              key: 'entries',
              header: '출전마',
              headerClassName: 'w-[120px] max-w-[120px] whitespace-nowrap',
              cellClassName: 'text-text-secondary w-[120px] max-w-[120px] overflow-x-auto',
              render: (race) => {
                const r = race as RaceDto & {
                  entries?: { hrName?: string }[];
                  entryDetails?: { hrName?: string }[];
                };
                const entries = (r.entries ?? r.entryDetails ?? []) as Array<{ hrName?: string }>;
                const preview = entries
                  .map((e) => e.hrName ?? '')
                  .filter(Boolean)
                  .join(', ');
                return (
                  <div className='whitespace-nowrap min-w-max' title={preview}>
                    {preview || '-'}
                  </div>
                );
              },
            },
            {
              key: 'status',
              header: '상태',
              headerClassName: 'w-20 whitespace-nowrap',
              cellClassName: 'whitespace-nowrap',
              render: (race) => (
                <StatusBadge
                  status={race.status || (race as RaceDto & { raceStatus?: string }).raceStatus || '-'}
                  rcDate={race.rcDate}
                />
              ),
            },
          ]}
          data={data?.races ?? []}
          getRowKey={(race) => race.id}
          getRowHref={(race) => routes.races.detail(race.id)}
          rowClassName={() => 'group'}
          className='data-table-kra'
        />
        <Pagination
          page={page}
          totalPages={data?.totalPages ?? 1}
          onPageChange={(p) => updateQuery({ page: p })}
          className='mt-4'
        />
      </DataFetchState>
    </Layout>
  );
}
