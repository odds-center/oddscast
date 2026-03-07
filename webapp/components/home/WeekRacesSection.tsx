/**
 * This week's races section
 */
import Link from 'next/link';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';
import RaceApi from '@/lib/api/raceApi';
import DataTable from '@/components/ui/DataTable';
import HomeSection from './HomeSection';
import { routes } from '@/lib/routes';
import { getTodayKstDate } from '@/lib/utils/format';
import type { RaceDto } from '@/lib/types/race';

function getWeekDates(): string[] {
  const kst = getTodayKstDate();
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(kst.year, kst.month - 1, kst.day + i));
    dates.push(`${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`);
  }
  return dates;
}

export default function WeekRacesSection() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['races', 'week'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await RaceApi.getRaces({ limit: 50, page: 1 });
      const races = (res?.races ?? []) as RaceDto[];
      const weekDates = getWeekDates();
      return races.filter((r) => {
        const d = (r.rcDate ?? '').replace(/-/g, '').slice(0, 8);
        return weekDates.some((wd) => d === wd);
      });
    },
  });

  const races = useMemo(() => (data ?? []).slice(0, 10), [data]);

  return (
    <HomeSection
      title='금주의 경주'
      icon='Calendar'
      viewAllHref={routes.races.list}
      viewAllLabel='더보기'
      badge={races.length > 0 ? `${races.length}경` : undefined}
    >
      {isLoading ? (
        <div className='py-4 text-center text-text-secondary text-sm'>준비 중...</div>
      ) : error ? (
        <div className='py-4 text-center text-text-secondary text-sm'>
          <p className='msg-error text-xs'>일시적인 오류가 발생했습니다.</p>
          <button type='button' onClick={() => refetch()} className='btn-secondary mt-2 px-3 py-1.5 text-xs'>
            다시 시도
          </button>
        </div>
      ) : races.length === 0 ? (
        <div className='py-4 text-center text-text-secondary text-sm'>이번 주 예정된 경주가 없습니다.</div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className='block sm:hidden divide-y divide-border -mx-0.5'>
            {races.map((row) => {
              const d = (row.rcDate ?? '').replace(/-/g, '');
              const dateStr = d.length >= 8 ? `${d.slice(4, 6)}/${d.slice(6, 8)}` : '';
              return (
                <a
                  key={row.id}
                  href={routes.races.detail(row.id)}
                  className='flex items-center justify-between py-2.5 px-0.5 active:bg-stone-50 transition-colors'
                >
                  <span className='font-semibold text-foreground text-sm'>
                    {row.meetName ?? row.meet ?? '-'} {row.rcNo}R
                  </span>
                  <div className='flex items-center gap-2 text-xs text-text-tertiary'>
                    {dateStr && <span>{dateStr}</span>}
                    {row.rcDist && <span>{row.rcDist}M</span>}
                  </div>
                </a>
              );
            })}
          </div>
          {/* Desktop: table */}
          <div className='hidden sm:block'>
            <DataTable
              className='data-table-kra'
              columns={[
                {
                  key: 'race',
                  header: '경주',
                  headerClassName: 'w-24 cell-center',
                  align: 'center',
                  render: (row) => (
                    <Link href={routes.races.detail(row.id)} className='text-stone-700 font-semibold hover:underline text-sm'>
                      {(row.meetName ?? row.meet ?? '-')} {row.rcNo}R
                    </Link>
                  ),
                },
                {
                  key: 'date',
                  header: '날짜',
                  headerClassName: 'w-16 cell-center',
                  align: 'center',
                  render: (row) => {
                    const d = (row.rcDate ?? '').replace(/-/g, '');
                    const str = d.length >= 8 ? `${d.slice(4, 6)}/${d.slice(6, 8)}` : '-';
                    return <span className='text-text-secondary'>{str}</span>;
                  },
                },
                {
                  key: 'dist',
                  header: '거리',
                  headerClassName: 'w-16 cell-center',
                  align: 'center',
                  render: (row) => (
                    <span className='text-text-secondary'>{row.rcDist ? `${row.rcDist}M` : '-'}</span>
                  ),
                },
                {
                  key: 'detail',
                  header: '',
                  headerClassName: 'w-12 cell-center',
                  align: 'center',
                  render: (row) => (
                    <Link href={routes.races.detail(row.id)} className='text-foreground text-xs font-medium hover:underline'>
                      보기
                    </Link>
                  ),
                },
              ]}
              data={races}
              getRowKey={(row) => row.id}
              getRowHref={(row) => routes.races.detail(row.id)}
              compact
            />
          </div>
        </>
      )}
    </HomeSection>
  );
}
