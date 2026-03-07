/**
 * Recent results section — grouped 1st·2nd·3rd place compact display
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';
import Link from 'next/link';
import ResultApi from '@/lib/api/resultApi';
import type { RaceResult } from '@/lib/api/resultApi';
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
      {isLoading ? (
        <div className='py-8 text-center text-text-secondary text-sm'>결과 준비 중...</div>
      ) : error ? (
        <div className='py-6 text-center text-text-secondary text-sm'>
          <p className='msg-error text-xs'>일시적인 오류가 발생했습니다.</p>
          <button type='button' onClick={() => refetch()} className='btn-secondary mt-2 px-3 py-1.5 text-xs'>
            다시 시도
          </button>
        </div>
      ) : grouped.length === 0 ? (
        <div className='py-8 text-center text-text-secondary text-sm'>최근 결과가 없습니다.</div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className='block sm:hidden divide-y divide-border -mx-0.5'>
            {grouped.slice(0, 6).map((row) => {
              const [p1, p2, p3] = ['1', '2', '3'].map((ord) => row.results.find((x) => x.ord === ord));
              return (
                <Link
                  key={row.raceId}
                  href={routes.resultsDetail(row.raceId)}
                  className='flex items-start justify-between py-2.5 px-0.5 active:bg-stone-50 transition-colors'
                >
                  <span className='font-semibold text-foreground text-sm min-w-[72px]'>
                    {row.meetName} {row.rcNo}경
                  </span>
                  <div className='flex items-center gap-1 text-xs text-text-secondary flex-wrap justify-end'>
                    {p1 && <span className='text-amber-600 font-medium'>🥇{p1.hrName}</span>}
                    {p2 && <span className='text-stone-500'>🥈{p2.hrName}</span>}
                    {p3 && <span className='text-stone-400'>🥉{p3.hrName}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
          {/* Desktop: table */}
          <div className='hidden sm:block overflow-x-auto'>
            <table className='data-table data-table-compact w-full min-w-[320px]'>
              <thead>
                <tr>
                  <th className='w-28'>경주</th>
                  <th className='min-w-[80px]'>1위</th>
                  <th className='min-w-[80px]'>2위</th>
                  <th className='min-w-[80px]'>3위</th>
                </tr>
              </thead>
              <tbody>
                {grouped.slice(0, 6).map((row) => (
                  <tr key={row.raceId}>
                    <td>
                      <Link
                        href={routes.resultsDetail(row.raceId)}
                        className='font-medium text-stone-700 hover:text-stone-900 hover:underline'
                      >
                        {row.meetName} {row.rcNo}경
                      </Link>
                    </td>
                    {(['1', '2', '3'] as const).map((ord) => {
                      const r = row.results.find((x) => x.ord === ord);
                      return (
                        <td key={ord} className='text-sm'>
                          {r ? (
                            <span className='font-medium'>{r.hrName}</span>
                          ) : (
                            <span className='text-text-tertiary'>-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </HomeSection>
  );
}
