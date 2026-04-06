/**
 * Recent results section — grouped 1st·2nd·3rd place with jockey info
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';
import Link from 'next/link';
import ResultApi from '@/lib/api/resultApi';
import type { RaceResult } from '@/lib/api/resultApi';
import DataFetchState from '@/components/page/DataFetchState';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import HomeSection from './HomeSection';
import { routes } from '@/lib/routes';

interface GroupedResult {
  ord: string;
  hrName: string;
  jkName: string;
  rcTime?: string;
}

interface GroupedRace {
  raceId: string;
  meetName: string;
  rcNo: string;
  rcDate: string;
  results: GroupedResult[];
}

function groupResults(raw: RaceResult[]): GroupedRace[] {
  const byRace = new Map<string, { meetName: string; rcNo: string; rcDate: string; results: GroupedResult[] }>();

  for (const r of raw) {
    const ord = parseInt(r.ord ?? '99', 10) || 99;
    if (ord > 3) continue;

    const rWithRace = r as RaceResult & {
      race?: { meetName?: string; rcNo?: string; rcDate?: string; id?: string };
      meetName?: string;
      rcNo?: string;
      rcDate?: string;
    };
    const raceId = String(rWithRace.raceId ?? rWithRace.race?.id ?? '');
    const meetName = rWithRace.race?.meetName ?? rWithRace.meetName ?? '-';
    const rcNo = rWithRace.race?.rcNo ?? rWithRace.rcNo ?? '-';
    const rcDate = rWithRace.race?.rcDate ?? rWithRace.rcDate ?? '';

    if (!byRace.has(raceId)) {
      byRace.set(raceId, { meetName, rcNo, rcDate, results: [] });
    }
    byRace.get(raceId)!.results.push({
      ord: r.ord ?? String(ord),
      hrName: r.hrName ?? '-',
      jkName: r.jkName ?? '-',
      rcTime: (r as { rcTime?: string }).rcTime,
    });
  }

  const list: GroupedRace[] = [];
  for (const [id, { meetName, rcNo, rcDate, results }] of byRace.entries()) {
    results.sort((a, b) => (parseInt(a.ord, 10) || 99) - (parseInt(b.ord, 10) || 99));
    list.push({ raceId: id, meetName, rcNo, rcDate, results });
  }
  const parseRcNo = (s: string) => {
    const n = parseInt(s, 10);
    return Number.isNaN(n) ? 0 : n;
  };
  list.sort((a, b) => {
    const dateCmp = (a.rcDate || '').localeCompare(b.rcDate || '');
    if (dateCmp !== 0) return -dateCmp;
    return parseRcNo(a.rcNo || '') - parseRcNo(b.rcNo || '');
  });
  return list;
}

const MEDAL = ['', '🥇', '🥈', '🥉'] as const;

export default function RecentResultsSection() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['results', 'recent'],
    placeholderData: keepPreviousData,
    queryFn: () =>
      ResultApi.getResults({
        limit: 60,
        page: 1,
      }),
  });

  const grouped = useMemo(() => groupResults(data?.results ?? []), [data?.results]);

  return (
    <HomeSection
      title='최근 결과'
      icon='TrendingUp'
      viewAllHref={routes.results}
      viewAllLabel='더보기'
      badge={grouped.length > 0 ? `${grouped.length}경기` : undefined}
    >
      <DataFetchState
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        isEmpty={grouped.length === 0}
        emptyIcon='TrendingUp'
        emptyTitle='최근 결과가 없습니다'
        loadingLabel='결과 준비 중...'
      >
        <>
          {/* Mobile: card list */}
          <div className='block sm:hidden divide-y divide-border -mx-0.5'>
            {grouped.slice(0, 8).map((row) => {
              const [p1, p2, p3] = ['1', '2', '3'].map((ord) => row.results.find((x) => x.ord === ord));
              return (
                <Link
                  key={row.raceId}
                  href={routes.resultsDetail(row.raceId)}
                  className='flex items-start justify-between py-3 px-1 active:bg-stone-50 transition-colors'
                >
                  <span className='font-bold text-foreground text-sm min-w-[72px]'>
                    {row.meetName} {row.rcNo}경
                  </span>
                  <div className='flex flex-col gap-0.5 items-end text-xs'>
                    {p1 && (
                      <span className='text-amber-600 font-semibold'>
                        {MEDAL[1]} {p1.hrName} <span className='text-text-tertiary font-normal'>({p1.jkName})</span>
                      </span>
                    )}
                    {p2 && (
                      <span className='text-stone-600'>
                        {MEDAL[2]} {p2.hrName} <span className='text-text-tertiary font-normal'>({p2.jkName})</span>
                      </span>
                    )}
                    {p3 && (
                      <span className='text-stone-500'>
                        {MEDAL[3]} {p3.hrName} <span className='text-text-tertiary font-normal'>({p3.jkName})</span>
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          {/* Desktop: table */}
          <div className='hidden sm:block'>
            <Table className='min-w-[400px] [&_th]:py-1 [&_th]:px-2 [&_td]:py-1.5 [&_td]:px-2'>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead className='w-28'>경주</TableHead>
                  <TableHead className='min-w-[100px]'>1위</TableHead>
                  <TableHead className='min-w-[100px]'>2위</TableHead>
                  <TableHead className='min-w-[80px]'>3위</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped.slice(0, 8).map((row) => (
                  <TableRow key={row.raceId}>
                    <TableCell>
                      <Link
                        href={routes.resultsDetail(row.raceId)}
                        className='font-semibold text-stone-700 hover:text-stone-900 hover:underline'
                      >
                        {row.meetName} {row.rcNo}경
                      </Link>
                    </TableCell>
                    {(['1', '2', '3'] as const).map((ord) => {
                      const r = row.results.find((x) => x.ord === ord);
                      return (
                        <TableCell key={ord}>
                          {r ? (
                            <div>
                              <span className='font-semibold text-sm'>{r.hrName}</span>
                              {r.jkName && r.jkName !== '-' && (
                                <span className='text-text-tertiary text-xs ml-1'>({r.jkName})</span>
                              )}
                            </div>
                          ) : (
                            <span className='text-text-tertiary'>-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      </DataFetchState>
    </HomeSection>
  );
}
