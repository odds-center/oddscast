import { useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import FilterDateBar from '@/components/page/FilterDateBar';
import Pagination from '@/components/page/Pagination';
import DataFetchState from '@/components/page/DataFetchState';
import { DataTable, LinkBadge } from '@/components/ui';
import ResultApi from '@/lib/api/resultApi';
import type { RaceResult } from '@/lib/api/resultApi';
import { routes } from '@/lib/routes';
import { formatRcDate } from '@/lib/utils/format';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { serverGet } from '@/lib/api/serverFetch';

interface TableResult {
  ord: string;
  chulNo?: string;
  hrNo: string;
  hrName: string;
  jkName: string;
  rcTime?: string;
  diffUnit?: string;
}

interface GroupedRace {
  raceId: string;
  meetName: string;
  rcNo: string;
  rcDate: string;
  rcDist?: string;
  results: TableResult[];
}

export default function Results() {
  const router = useRouter();
  const qDate = router.query?.date as string | undefined;
  const qMeet = (router.query?.meet as string) || '';
  const dateFilter = parseDateFilter(qDate);
  const page = Math.max(1, parseInt(String(router.query?.page ?? 1), 10) || 1);

  const updateQuery = (updates: Record<string, string | number | undefined>) => {
    const next = { ...router.query, ...updates };
    Object.keys(updates).forEach((k) => {
      if (updates[k] === undefined || updates[k] === '') delete next[k];
    });
    router.replace({ pathname: router.pathname, query: next }, undefined, { shallow: true });
  };

  const RESULTS_PER_PAGE = 20;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['results', 'grouped', page, dateFilter, qMeet],
    placeholderData: keepPreviousData,
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
      return ResultApi.getResultsGroupedByRace({
        limit: RESULTS_PER_PAGE,
        page,
        ...(date && { date }),
        ...(qMeet && { meet: qMeet }),
      });
    },
  });

  const groupedRaces = useMemo((): GroupedRace[] => {
    const groups = data?.raceGroups ?? [];
    return groups.map((g) => ({
      raceId: g.race.id,
      meetName: g.race.meetName ?? '-',
      rcNo: g.race.rcNo ?? '-',
      rcDate: g.race.rcDate ?? '',
      rcDist: g.race.rcDist,
      results: (g.results ?? []).map((r) => ({
        ord: r.ord ?? '99',
        chulNo: r.chulNo,
        hrNo: r.hrNo,
        hrName: r.hrName,
        jkName: r.jkName,
        rcTime: r.rcTime,
        diffUnit: r.diffUnit,
      })),
    }));
  }, [data?.raceGroups]);

  const totalPages = data?.totalPages ?? 1;

  /** 1st·2nd·3rd place cells: horizontal layout (horse name, jockey, record in one line) */
  function renderRankCell(race: GroupedRace, ord: '1' | '2' | '3') {
    const r = race.results.find((x) => x.ord === ord);
    if (!r) return <span className='text-text-tertiary'>-</span>;
    const no = r.chulNo ?? (r.hrNo && r.hrNo.length <= 2 ? r.hrNo : '-');
    // Record: 1st place=rcTime, 2nd·3rd place=diffUnit (difference)
    const record = ord === '1' && r.rcTime ? r.rcTime : r.diffUnit;
    return (
      <span className='inline-flex items-center gap-1.5 flex-wrap text-sm'>
        <span className='badge-muted shrink-0'>{no}</span>
        <span className='font-medium'>{r.hrName}</span>
        <span className='text-text-secondary'>({r.jkName})</span>
        {record && (
          <span className='text-text-tertiary font-mono text-xs ml-1' title='기록'>
            {record}
          </span>
        )}
      </span>
    );
  }

  return (
    <Layout title='경주 결과 | OddsCast'>
      <CompactPageTitle title='경주 결과' />
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
              : dateFilter === 'today'
                ? new Date().toISOString().slice(0, 10)
                : ''
        }
        onDateChange={(v) => updateQuery({ date: v || undefined, page: 1 })}
        dateId='result-date'
        showMeetFilter
        meetValue={qMeet}
        onMeetChange={(v) => updateQuery({ meet: v || undefined, page: 1 })}
      />

      <DataFetchState
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        isEmpty={!groupedRaces.length}
        emptyIcon='TrendingUp'
        emptyTitle='경주 결과가 없습니다'
        emptyDescription='해당 조건에 맞는 경주 결과가 없습니다.'
        loadingLabel='결과 준비 중...'
      >
        {/* Mobile: compact card */}
        <div className='block lg:hidden space-y-2'>
          {groupedRaces.map((row) => (
            <Link key={row.raceId} href={routes.resultsDetail(row.raceId)} className='block rounded-md border border-stone-200 bg-white p-2.5 hover:bg-stone-50 transition-colors'>
              <div className='flex items-center justify-between mb-1.5'>
                <span className='font-semibold text-foreground text-sm'>{row.meetName} {row.rcNo}R</span>
                <span className='text-text-tertiary text-xs'>{formatRcDate(row.rcDate)}{row.rcDist ? ` · ${row.rcDist}m` : ''}</span>
              </div>
              <div className='flex items-center gap-3 text-xs'>
                {(['1', '2', '3'] as const).map((ord) => {
                  const r = row.results.find((x) => x.ord === ord);
                  const cls = ord === '1' ? 'text-foreground' : ord === '2' ? 'text-stone-600' : 'text-stone-500';
                  return (
                    <span key={ord} className='inline-flex items-center gap-1'>
                      <span className={`font-bold ${cls}`}>{ord}위</span>
                      {r ? (
                        <span className='font-medium text-foreground'>{r.chulNo ? `${r.chulNo} ` : ''}{r.hrName}</span>
                      ) : (
                        <span className='text-text-tertiary'>-</span>
                      )}
                    </span>
                  );
                })}
                <span className='text-text-tertiary ml-auto'>{row.results.length}두</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop: table */}
        <div className='hidden lg:block overflow-x-auto'>
          <DataTable
            compact
            columns={[
              { key: 'race', header: '경주', headerClassName: 'w-24 whitespace-nowrap', cellClassName: 'whitespace-nowrap', render: (row) => (
                <LinkBadge href={routes.resultsDetail(row.raceId)} icon='Flag' iconSize={12}>
                  {row.meetName} {row.rcNo}R
                </LinkBadge>
              ) },
              { key: 'date', header: '날짜', headerClassName: 'w-20', render: (row) => (
                <span className='text-text-secondary text-xs'>{formatRcDate(row.rcDate)}{row.rcDist ? ` · ${row.rcDist}m` : ''}</span>
              ) },
              { key: 'ord1', header: '1위', headerClassName: 'min-w-[100px]', render: (row) => renderRankCell(row, '1') },
              { key: 'ord2', header: '2위', headerClassName: 'min-w-[100px]', render: (row) => renderRankCell(row, '2') },
              { key: 'ord3', header: '3위', headerClassName: 'min-w-[100px]', render: (row) => renderRankCell(row, '3') },
              { key: 'entries', header: '두수', headerClassName: 'w-14', align: 'center', render: (row) => (
                <span className='text-text-tertiary text-xs'>{row.results.length}</span>
              ) },
            ]}
            data={groupedRaces}
            getRowKey={(row) => row.raceId}
            getRowHref={(row) => routes.resultsDetail(row.raceId)}
            className='data-table-kra'
          />
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => updateQuery({ page: p })}
          className='mt-3'
        />
      </DataFetchState>
    </Layout>
  );
}

function parseDateFilter(qDate: string | undefined): string {
  if (qDate === 'today' || qDate === 'yesterday') return qDate;
  if (qDate && /^\d{4}-?\d{2}-?\d{2}$/.test(qDate.replace(/-/g, ''))) {
    return qDate.includes('-') ? qDate : `${qDate.slice(0, 4)}-${qDate.slice(4, 6)}-${qDate.slice(6, 8)}`;
  }
  return '';
}

function dateToParam(dateFilter: string): string | undefined {
  if (dateFilter === 'today') return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  if (dateFilter === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10).replace(/-/g, '');
  }
  if (dateFilter) return dateFilter.replace(/-/g, '');
  return undefined;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const query = context.query as Record<string, string | undefined>;
  const qDate = query?.date;
  const qMeet = query?.meet || '';
  const dateFilter = parseDateFilter(qDate);
  const page = Math.max(1, parseInt(String(query?.page ?? 1), 10) || 1);
  const date = dateToParam(dateFilter);

  const queryClient = new QueryClient();
  try {
    const params: Record<string, string | number> = { groupByRace: 'true', limit: 20, page };
    if (date) params.date = date;
    if (qMeet) params.meet = qMeet;
    await queryClient.prefetchQuery({
      queryKey: ['results', 'grouped', page, dateFilter, qMeet],
      queryFn: () =>
        serverGet<{ raceGroups?: unknown[]; total?: number; totalPages?: number }>('/results', { params }),
    });
  } catch {
    // Fetch on client if SSR fails
  }
  return { props: { dehydratedState: dehydrate(queryClient) } };
};
