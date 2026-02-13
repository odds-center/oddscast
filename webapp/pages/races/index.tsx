/**
 * 전체 경주 목록 페이지 — 필터 + 테이블 + 페이지네이션
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import PageHeader from '@/components/page/PageHeader';
import BackLink from '@/components/page/BackLink';
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
  const [dateFilter, setDateFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const q = router.query?.date as string | undefined;
    if (q === 'today') setDateFilter('today');
    else if (q && /^\d{4}-?\d{2}-?\d{2}$/.test(q.replace(/-/g, ''))) {
      const normalized = q.includes('-') ? q : `${q.slice(0, 4)}-${q.slice(4, 6)}-${q.slice(6, 8)}`;
      setDateFilter(normalized);
    }
  }, [router.query?.date]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['races', 'list', dateFilter, page],
    queryFn: () => {
      const date =
        dateFilter === 'today' ? new Date().toISOString().slice(0, 10).replace(/-/g, '') : dateFilter;
      return RaceApi.getRaces({
        limit: RACES_PER_PAGE,
        page,
        ...(date && { date }),
      });
    },
  });

  return (
    <Layout title='전체 경주 — GOLDEN RACE'>
      <BackLink href={routes.home} label='홈으로' className='mb-4' />
      <PageHeader
        icon='ClipboardList'
        title='전체 경주'
        description='날짜별 경주 목록을 확인할 수 있습니다.'
      />
      <FilterDateBar
        filterOptions={[
          { value: '', label: '전체' },
          { value: 'today', label: '오늘' },
        ]}
        filterValue={dateFilter === 'today' ? 'today' : dateFilter || ''}
        onFilterChange={(v) => {
          setDateFilter(v);
          setPage(1);
        }}
        dateValue={dateFilter && dateFilter !== 'today' ? dateFilter : ''}
        onDateChange={(v) => {
          setDateFilter(v || '');
          setPage(1);
        }}
        dateId='races-list-date'
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
                />
              ),
            },
          ]}
          data={data?.races ?? []}
          getRowKey={(race) => race.id}
          rowClassName={() => 'group'}
          className='text-[14px]'
        />
        <Pagination
          page={page}
          totalPages={data?.totalPages ?? 1}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(data?.totalPages ?? 1, p + 1))}
          className='mt-4'
        />
      </DataFetchState>
    </Layout>
  );
}
