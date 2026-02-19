/**
 * 최근 결과 섹션 — 1·2·3위 그룹화 compact 표시
 */
import { useQuery } from '@tanstack/react-query';
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
  list.sort((a, b) => {
    const dateCmp = (a.rcDate || '').localeCompare(b.rcDate || '');
    if (dateCmp !== 0) return -dateCmp;
    return (a.rcNo || '').localeCompare(b.rcNo || '');
  });
  return list;
}

export default function RecentResultsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['results', 'recent'],
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
        <div className='py-8 text-center text-text-secondary text-sm'>결과를 불러오는 중...</div>
      ) : grouped.length === 0 ? (
        <div className='py-8 text-center text-text-secondary text-sm'>최근 결과가 없습니다.</div>
      ) : (
        <div className='overflow-x-auto'>
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
      )}
    </HomeSection>
  );
}
