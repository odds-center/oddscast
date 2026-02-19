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
import { useQuery } from '@tanstack/react-query';

interface TableResult {
  ord: string;
  chulNo?: string;
  hrNo: string;
  hrName: string;
  jkName: string;
  rcTime?: string;
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
    queryKey: ['results', page, dateFilter, qMeet],
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
      return ResultApi.getResults({
        limit: 250,
        page,
        ...(date && { date }),
        ...(qMeet && { meet: qMeet }),
      });
    },
  });

  const groupedRaces = useMemo(() => {
    const rawResults: RaceResult[] = data?.results ?? [];
    const byRace = new Map<
      string,
      { meetName: string; rcNo: string; rcDate: string; rcDist?: string; results: TableResult[] }
    >();

    for (const r of rawResults) {
      const ord = parseInt(r.ord ?? '99', 10) || 99;
      if (ord > 3) continue;

      const rWithRace = r as RaceResult & {
        race?: { meetName?: string; rcNo?: string; rcDate?: string; rcDist?: string; id?: string };
        meetName?: string;
        rcNo?: string;
        rcDate?: string;
        rcDist?: string;
      };
      const raceId = String(rWithRace.raceId ?? rWithRace.race?.id ?? rWithRace.id ?? '');
      const meetName = rWithRace.race?.meetName ?? rWithRace.meetName ?? '-';
      const rcNo = rWithRace.race?.rcNo ?? rWithRace.rcNo ?? '-';
      const rcDate = rWithRace.race?.rcDate ?? rWithRace.rcDate ?? '';
      const rcDist = rWithRace.race?.rcDist ?? rWithRace.rcDist;

      if (!byRace.has(raceId)) {
        byRace.set(raceId, { meetName, rcNo, rcDate, rcDist, results: [] });
      }
      byRace.get(raceId)!.results.push({
        ord: r.ord ?? String(ord),
        chulNo: r.chulNo,
        hrNo: r.hrNo,
        hrName: r.hrName,
        jkName: r.jkName,
        rcTime: (r as { rcTime?: string }).rcTime,
      });
    }

    const list: GroupedRace[] = [];
    for (const [raceId, { meetName, rcNo, rcDate, rcDist, results }] of byRace.entries()) {
      results.sort((a, b) => (parseInt(a.ord, 10) || 99) - (parseInt(b.ord, 10) || 99));
      list.push({ raceId, meetName, rcNo, rcDate, rcDist, results });
    }

    list.sort((a, b) => {
      const dateCmp = (a.rcDate || '').localeCompare(b.rcDate || '');
      if (dateCmp !== 0) return -dateCmp;
      return (a.rcNo || '').localeCompare(b.rcNo || '');
    });
    return list;
  }, [data?.results]);

  const totalPages = data?.totalPages ?? 1;

  function renderRankCell(race: GroupedRace, ord: '1' | '2' | '3') {
    const r = race.results.find((x) => x.ord === ord);
    if (!r) return <span className='text-text-tertiary'>-</span>;
    const no = r.chulNo ?? (r.hrNo && r.hrNo.length <= 2 ? r.hrNo : '-');
    return (
      <span className='inline-flex flex-col gap-0.5'>
        <span className='inline-flex items-center gap-1.5 flex-wrap'>
          <span className='badge-muted'>{no}</span>
          <span className='font-medium'>{r.hrName}</span>
          <span className='text-text-secondary text-sm'>({r.jkName})</span>
        </span>
        {ord === '1' && r.rcTime && (
          <span className='text-text-tertiary text-xs font-mono'>{r.rcTime}</span>
        )}
      </span>
    );
  }

  return (
    <Layout title='경주 결과 | GOLDEN RACE'>
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
        emptyTitle='결과 데이터가 없습니다'
        emptyDescription='해당 조건에 맞는 경주 결과가 없습니다.'
        loadingLabel='결과를 불러오는 중...'
      >
        {/* 모바일: 카드형 | 데스크톱: 테이블 */}
        <div className='block lg:hidden space-y-3'>
          {groupedRaces.map((row) => (
            <Link
              key={row.raceId}
              href={routes.resultsDetail(row.raceId)}
              className='block card card-hover p-4 border-l-4 border-l-primary/60 touch-manipulation'
            >
              <div className='flex items-center justify-between mb-3'>
                <span className='font-semibold text-foreground'>{row.meetName} {row.rcNo}경</span>
                <span className='text-text-secondary text-sm'>{formatRcDate(row.rcDate)}</span>
              </div>
              {row.rcDist && (
                <span className='text-text-tertiary text-xs mb-2 block'>{row.rcDist}m</span>
              )}
              <div className='grid grid-cols-3 gap-2 text-sm'>
                {(['1', '2', '3'] as const).map((ord) => {
                  const r = row.results.find((x) => x.ord === ord);
                  const rankStyle = ord === '1' ? 'bg-emerald-50 text-emerald-800' : ord === '2' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50/80 text-amber-800';
                  return (
                    <div key={ord} className={`rounded-lg p-2.5 ${rankStyle}`}>
                      <span className='text-[10px] font-medium text-text-tertiary block mb-0.5'>{ord}위</span>
                      {r ? (
                        <>
                          <span className='font-medium block truncate'>{r.hrName}</span>
                          <span className='text-xs text-text-secondary truncate block'>{r.jkName}</span>
                          {ord === '1' && r.rcTime && (
                            <span className='text-xs font-mono text-text-tertiary block mt-1'>{r.rcTime}</span>
                          )}
                        </>
                      ) : (
                        <span className='text-text-tertiary'>-</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Link>
          ))}
        </div>
        <div className='hidden lg:block overflow-x-auto'>
          <DataTable
            columns={[
              { key: 'race', header: '경주', headerClassName: 'w-28 whitespace-nowrap', cellClassName: 'whitespace-nowrap', render: (row) => (
                <LinkBadge href={routes.resultsDetail(row.raceId)} icon='Flag' iconSize={14}>
                  {row.meetName} {row.rcNo}경
                </LinkBadge>
              ) },
              { key: 'date', header: '날짜', headerClassName: 'w-24', render: (row) => (
                <div>
                  <span className='text-text-secondary text-sm block'>{formatRcDate(row.rcDate)}</span>
                  {row.rcDist && <span className='text-text-tertiary text-xs'>{row.rcDist}m</span>}
                </div>
              ) },
              { key: 'ord1', header: '1위', headerClassName: 'min-w-[120px]', render: (row) => renderRankCell(row, '1') },
              { key: 'ord2', header: '2위', headerClassName: 'min-w-[120px]', render: (row) => renderRankCell(row, '2') },
              { key: 'ord3', header: '3위', headerClassName: 'min-w-[120px]', render: (row) => renderRankCell(row, '3') },
            ]}
            data={groupedRaces}
            getRowKey={(row) => row.raceId}
            getRowHref={(row) => routes.resultsDetail(row.raceId)}
            rowClassName={() => 'group hover:bg-slate-50/50'}
            className='text-[14px]'
          />
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => updateQuery({ page: p })}
          className='mt-4'
        />
      </DataFetchState>
    </Layout>
  );
}
