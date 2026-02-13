import { useMemo } from 'react';
import { useRouter } from 'next/router';
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
}

interface GroupedRace {
  raceId: string;
  meetName: string;
  rcNo: string;
  rcDate: string;
  results: TableResult[];
}

export default function Results() {
  const router = useRouter();
  const qDate = router.query?.date as string | undefined;
  const dateFilter =
    qDate === 'today'
      ? 'today'
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
    queryKey: ['results', page, dateFilter],
    queryFn: () =>
      ResultApi.getResults({
        limit: 250,
        page,
        ...(dateFilter && { date: dateFilter }),
      }),
  });

  const groupedRaces = useMemo(() => {
    const rawResults: RaceResult[] = data?.results ?? [];
    const byRace = new Map<
      string,
      { meetName: string; rcNo: string; rcDate: string; results: TableResult[] }
    >();

    for (const r of rawResults) {
      const ord = parseInt(r.ord ?? '99', 10) || 99;
      if (ord > 3) continue;

      const rWithRace = r as RaceResult & {
        race?: { meetName?: string; rcNo?: string; rcDate?: string; id?: string };
        meetName?: string;
        rcNo?: string;
        rcDate?: string;
      };
      const raceId = String(rWithRace.raceId ?? rWithRace.race?.id ?? rWithRace.id ?? '');
      const meetName = rWithRace.race?.meetName ?? rWithRace.meetName ?? '-';
      const rcNo = rWithRace.race?.rcNo ?? rWithRace.rcNo ?? '-';
      const rcDate = rWithRace.race?.rcDate ?? rWithRace.rcDate ?? '';

      if (!byRace.has(raceId)) {
        byRace.set(raceId, { meetName, rcNo, rcDate, results: [] });
      }
      byRace.get(raceId)!.results.push({
        ord: r.ord ?? String(ord),
        chulNo: r.chulNo,
        hrNo: r.hrNo,
        hrName: r.hrName,
        jkName: r.jkName,
      });
    }

    const list: GroupedRace[] = [];
    for (const [raceId, { meetName, rcNo, rcDate, results }] of byRace.entries()) {
      results.sort((a, b) => (parseInt(a.ord, 10) || 99) - (parseInt(b.ord, 10) || 99));
      list.push({ raceId, meetName, rcNo, rcDate, results });
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
      <span className='inline-flex items-center gap-1.5'>
        <span className='badge-muted'>{no}</span>
        <span className='font-medium'>{r.hrName}</span>
        <span className='text-text-secondary text-sm'>({r.jkName})</span>
      </span>
    );
  }

  return (
    <Layout title='GOLDEN RACE'>
      <CompactPageTitle title='경주 결과' />
      <FilterDateBar
        filterOptions={[{ value: '', label: '전체' }]}
        filterValue={dateFilter || ''}
        onFilterChange={(v) => updateQuery({ date: v || undefined, page: 1 })}
        dateValue={dateFilter}
        onDateChange={(v) => updateQuery({ date: v || undefined, page: 1 })}
        dateId='result-date'
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
        <DataTable
          columns={[
            { key: 'race', header: '경주', headerClassName: 'w-28 whitespace-nowrap', cellClassName: 'whitespace-nowrap', render: (row) => (
              <LinkBadge href={routes.resultsDetail(row.raceId)} icon='Flag' iconSize={14}>
                {row.meetName} {row.rcNo}경
              </LinkBadge>
            ) },
            { key: 'date', header: '날짜', headerClassName: 'w-20', render: (row) => (
              <span className='text-text-secondary text-sm'>{formatRcDate(row.rcDate)}</span>
            ) },
            { key: 'ord1', header: '1위', headerClassName: 'min-w-[100px]', render: (row) => renderRankCell(row, '1') },
            { key: 'ord2', header: '2위', headerClassName: 'min-w-[100px]', render: (row) => renderRankCell(row, '2') },
            { key: 'ord3', header: '3위', headerClassName: 'min-w-[100px]', render: (row) => renderRankCell(row, '3') },
          ]}
          data={groupedRaces}
          getRowKey={(row) => row.raceId}
          getRowHref={(row) => routes.resultsDetail(row.raceId)}
          rowClassName={() => 'group'}
          className='text-[14px]'
        />

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
