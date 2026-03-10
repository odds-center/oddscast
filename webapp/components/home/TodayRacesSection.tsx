/**
 * Today's races section — KRA race schedule style
 * Auto-refresh every 5 min on race days (Fri/Sat/Sun).
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import RaceApi from '@/lib/api/raceApi';
import DataTable from '@/components/ui/DataTable';
import HomeSection from './HomeSection';
import { routes } from '@/lib/routes';
import { StatusBadge, LinkBadge } from '@/components/ui';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { getTodayKstDate, isRaceActuallyEnded } from '@/lib/utils/format';
import { TODAY_ALL_ENDED_MESSAGE } from '@/lib/utils/dateHeaderMessages';
import type { RaceDto } from '@/lib/types/race';
import type { RaceDetailDto } from '@oddscast/shared';

const RACE_DAYS = [5, 6, 0]; // Fri, Sat, Sun (KST)
const LIVE_REFETCH_MS = 5 * 60 * 1000;

export default function TodayRacesSection() {
  const { weekDay } = getTodayKstDate();
  const isTodayRaceDay = RACE_DAYS.includes(weekDay);
  // Share cache with DateHeader and HomeQuickStats (same key/queryFn)
  const { data: todayData, isLoading, error, refetch } = useQuery({
    queryKey: ['races', 'today', 'stats'],
    placeholderData: keepPreviousData,
    refetchInterval: isTodayRaceDay ? LIVE_REFETCH_MS : false,
    queryFn: () => RaceApi.getRaces({ limit: 100, page: 1, date: 'today' }),
  });

  const allTodayRaces = (todayData?.races ?? []) as RaceDto[];
  const races = allTodayRaces.slice(0, 12);
  const allEnded =
    allTodayRaces.length > 0 &&
    allTodayRaces.every((r) => isRaceActuallyEnded(r.rcDate, r.stTime));

  return (
    <HomeSection
      title='발매경주'
      icon='Flag'
      viewAllHref={`${routes.races.list}?date=today`}
      viewAllLabel='더보기'
      badge={races.length > 0 ? `${races.length}경` : undefined}
    >
      {isLoading ? (
        <div className='py-6'>
          <LoadingSpinner size={24} label='준비 중...' />
        </div>
      ) : error ? (
        <div className='py-4 text-center text-text-secondary text-sm'>
          <p className='msg-error text-xs'>일시적인 오류가 발생했습니다.</p>
          <Button type='button' variant='outline' size='sm' onClick={() => refetch()} className='mt-2'>
            다시 시도
          </Button>
        </div>
      ) : races.length === 0 ? (
        <div className='py-4 text-center text-text-secondary text-sm'>오늘 예정된 경주가 없습니다.</div>
      ) : (
        <>
          {allEnded && (
            <p className='mb-3 text-center text-sm text-text-secondary'>
              {TODAY_ALL_ENDED_MESSAGE}
            </p>
          )}
          {/* Mobile: card list */}
          <div className='block sm:hidden divide-y divide-border -mx-0.5'>
            {races.map((row) => {
              const detail = row as RaceDetailDto;
              const entries = detail.entries ?? detail.entryDetails ?? [];
              return (
                <a
                  key={row.id}
                  href={routes.races.detail(row.id)}
                  className='flex items-center justify-between py-2.5 px-0.5 active:bg-stone-50 transition-colors'
                >
                  <div>
                    <span className='font-semibold text-foreground text-sm'>
                      {row.meetName ?? row.meet ?? '-'} {row.rcNo}R
                    </span>
                    <div className='flex items-center gap-2 mt-0.5 text-xs text-text-tertiary'>
                      {row.rcDist && <span>{row.rcDist}M</span>}
                      {entries.length > 0 && <span>{entries.length}두</span>}
                      {row.stTime && <span>{row.stTime}</span>}
                    </div>
                  </div>
                  <StatusBadge status={row.status ?? row.raceStatus ?? ''} rcDate={row.rcDate} stTime={row.stTime} />
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
                    <LinkBadge href={routes.races.detail(row.id)} icon='Flag' iconSize={12}>
                      {(row.meetName ?? row.meet ?? '-')} {row.rcNo}R
                    </LinkBadge>
                  ),
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
                  key: 'entries',
                  header: '두수',
                  headerClassName: 'w-12 cell-center',
                  align: 'center',
                  render: (row) => {
                    const detail = row as RaceDetailDto;
                    const entries = detail.entries ?? detail.entryDetails ?? [];
                    return <span className='text-text-secondary'>{entries.length > 0 ? `${entries.length}` : '-'}</span>;
                  },
                },
                {
                  key: 'status',
                  header: '상태',
                  headerClassName: 'w-14 cell-center',
                  align: 'center',
                  render: (row) => (
                    <StatusBadge status={row.status ?? row.raceStatus ?? ''} rcDate={row.rcDate} stTime={row.stTime} />
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
