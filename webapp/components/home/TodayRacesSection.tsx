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
import type { RaceDto } from '@/lib/types/race';
import type { RaceDetailDto } from '@oddscast/shared';

const RACE_DAYS = [5, 6, 0]; // Fri, Sat, Sun
const LIVE_REFETCH_MS = 5 * 60 * 1000;

function isRaceDay(d: Date): boolean {
  return RACE_DAYS.includes(d.getDay());
}

export default function TodayRacesSection() {
  const isTodayRaceDay = isRaceDay(new Date());
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['races', 'today'],
    placeholderData: keepPreviousData,
    refetchInterval: isTodayRaceDay ? LIVE_REFETCH_MS : false,
    queryFn: async () => {
      const res = await RaceApi.getRaces({ limit: 12, page: 1, date: 'today' });
      return res?.races ?? [];
    },
  });

  const races = (data ?? []) as RaceDto[];

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
          <button type='button' onClick={() => refetch()} className='btn-secondary mt-2 px-3 py-1.5 text-xs'>
            다시 시도
          </button>
        </div>
      ) : races.length === 0 ? (
        <div className='py-4 text-center text-text-secondary text-sm'>오늘 예정된 경주가 없습니다.</div>
      ) : (
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
      )}
    </HomeSection>
  );
}
