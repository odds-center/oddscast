/**
 * 오늘의 경주 섹션 — KRA 발매경주표 스타일 테이블
 */
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import RaceApi from '@/lib/api/raceApi';
import DataTable from '@/components/ui/DataTable';
import HomeSection from './HomeSection';
import { routes } from '@/lib/routes';
import { StatusBadge } from '@/components/ui';
import type { RaceDto } from '@/lib/types/race';
import type { RaceDetailDto } from '@goldenrace/shared';

export default function TodayRacesSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['races', 'today'],
    queryFn: async () => {
      const res = await RaceApi.getRaces({
        limit: 12,
        page: 1,
        date: 'today',
      });
      return res?.races ?? [];
    },
  });

  const races = (data ?? []) as RaceDto[];

  return (
    <HomeSection
      title='발매경주'
      icon='Flag'
      viewAllHref={`${routes.races.list}?date=today`}
      viewAllLabel='전체보기'
    >
      {isLoading ? (
        <div className='py-8 text-center text-text-secondary text-sm'>경주 정보를 불러오는 중...</div>
      ) : races.length === 0 ? (
        <div className='py-8 text-center text-text-secondary text-sm'>오늘 예정된 경주가 없습니다.</div>
      ) : (
        <DataTable
          className='data-table-kra'
          columns={[
            {
              key: 'meet',
              header: '지역',
              headerClassName: 'w-16 cell-center',
              align: 'center',
              render: (row) => (
                <span className='font-medium text-foreground'>{row.meetName ?? row.meet ?? '-'}</span>
              ),
            },
            {
              key: 'rcNo',
              header: '경주번호',
              headerClassName: 'w-20 cell-center',
              align: 'center',
              render: (row) => (
                <Link
                  href={routes.races.detail(row.id)}
                  className='text-slate-700 font-semibold hover:underline'
                >
                  {row.rcNo}R
                </Link>
              ),
            },
            {
              key: 'type',
              header: '경주구분',
              headerClassName: 'w-20 cell-center',
              align: 'center',
              render: () => <span className='text-text-secondary'>일반</span>,
            },
            {
              key: 'dist',
              header: '거리',
              headerClassName: 'w-20 cell-center',
              align: 'center',
              render: (row) => (
                <Link href={routes.races.detail(row.id)} className='text-slate-700 hover:underline'>
                  {row.rcDist ? `${row.rcDist}M` : '-'}
                </Link>
              ),
            },
            {
              key: 'entries',
              header: '출전',
              headerClassName: 'w-14 cell-center',
              align: 'center',
              render: (row) => {
                const detail = row as RaceDetailDto;
                const entries = detail.entries ?? detail.entryDetails ?? [];
                const count = entries.length;
                return <span className='text-text-secondary'>{count > 0 ? `${count}두` : '-'}</span>;
              },
            },
            {
              key: 'result',
              header: '경주성적',
              headerClassName: 'cell-center',
              align: 'center',
              render: (row) => (
                <span className='text-text-secondary'>{row.rank ?? '-'}</span>
              ),
            },
            {
              key: 'status',
              header: '상태',
              headerClassName: 'w-20 cell-center',
              align: 'center',
              render: (row) => (
                <StatusBadge status={row.status ?? row.raceStatus ?? ''} rcDate={row.rcDate} />
              ),
            },
            {
              key: 'detail',
              header: '상세',
              headerClassName: 'w-16 cell-center',
              align: 'center',
              render: (row) => (
                <Link
                  href={routes.races.detail(row.id)}
                  className='text-slate-700 text-sm font-medium hover:underline'
                >
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
      )}
    </HomeSection>
  );
}
