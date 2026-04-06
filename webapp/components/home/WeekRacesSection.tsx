/**
 * This week's races section
 */
import Link from 'next/link';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';
import RaceApi from '@/lib/api/raceApi';
import DataTable from '@/components/ui/DataTable';
import HomeSection from './HomeSection';
import DataFetchState from '@/components/page/DataFetchState';
import { routes } from '@/lib/routes';
import Icon from '@/components/icons';
import { getTodayKstDate } from '@/lib/utils/format';
import type { RaceDto } from '@/lib/types/race';

const WEEKDAY_TIPS = [
  { icon: 'ClipboardList' as const, text: '경주 전 출전마의 최근 5경기 성적을 확인하세요.' },
  { icon: 'BarChart2' as const, text: '종합예상표는 한눈에 모든 경주를 비교할 수 있어요.' },
  { icon: 'Medal' as const, text: '기수 성적은 경마장별로 다릅니다. 홈 경마장 기수를 주목하세요.' },
  { icon: 'Flag' as const, text: '비 오는 날은 주로 상태가 달라져요. 습주로 적성마를 확인하세요.' },
  { icon: 'Clock' as const, text: '휴식 21~42일이 최적. 너무 짧거나 긴 휴식은 성적에 영향을 줍니다.' },
];

function getWeekRange(): { dateFrom: string; dateTo: string } {
  const kst = getTodayKstDate();
  const from = new Date(Date.UTC(kst.year, kst.month - 1, kst.day));
  const to = new Date(Date.UTC(kst.year, kst.month - 1, kst.day + 6));
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  return { dateFrom: fmt(from), dateTo: fmt(to) };
}

/** Rotating racing tips for weekday visitors */
function WeekdayTipsView() {
  const { day } = getTodayKstDate();
  // Rotate tips based on day of month
  const tipIndex = day % WEEKDAY_TIPS.length;
  const tip = WEEKDAY_TIPS[tipIndex];
  const nextTip = WEEKDAY_TIPS[(tipIndex + 1) % WEEKDAY_TIPS.length];
  return (
    <div className='py-3'>
      <p className='text-xs text-text-tertiary text-center mb-3'>경주는 매주 금·토·일 진행됩니다</p>
      <div className='space-y-2'>
        {[tip, nextTip].map((t, i) => (
          <div key={i} className='flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-stone-50 border border-stone-100'>
            <Icon name={t.icon} size={16} className='text-primary shrink-0 mt-0.5' />
            <p className='text-xs text-text-secondary leading-relaxed'>{t.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WeekRacesSection() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['races', 'week'],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { dateFrom, dateTo } = getWeekRange();
      const res = await RaceApi.getRaces({ limit: 50, page: 1, dateFrom, dateTo });
      return (res?.races ?? []) as RaceDto[];
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
      <DataFetchState
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        loadingLabel='준비 중...'
      >
        {/* When no races this week, show rotating racing tips instead of empty state */}
        {races.length === 0 ? (
          <WeekdayTipsView />
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
                  className='flex items-center justify-between py-3 px-1 active:bg-stone-50 transition-colors'
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
              className=''
              columns={[
                {
                  key: 'race',
                  header: '경주',
                  headerClassName: 'w-24 text-center',
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
                  headerClassName: 'w-16 text-center',
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
                  headerClassName: 'w-16 text-center',
                  align: 'center',
                  render: (row) => (
                    <span className='text-text-secondary'>{row.rcDist ? `${row.rcDist}M` : '-'}</span>
                  ),
                },
                {
                  key: 'detail',
                  header: '',
                  headerClassName: 'w-12 text-center',
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
      </DataFetchState>
    </HomeSection>
  );
}
