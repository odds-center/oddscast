/**
 * Today's races section — KRA race schedule style
 */
import { useQuery } from '@tanstack/react-query';
import RaceApi from '@/lib/api/raceApi';
import DataTable from '@/components/ui/DataTable';
import HomeSection from './HomeSection';
import { routes } from '@/lib/routes';
import { StatusBadge, LinkBadge } from '@/components/ui';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { RaceDto } from '@/lib/types/race';
import type { RaceDetailDto } from '@goldenrace/shared';

export default function TodayRacesSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['races', 'today'],
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
                <StatusBadge status={row.status ?? row.raceStatus ?? ''} rcDate={row.rcDate} />
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
