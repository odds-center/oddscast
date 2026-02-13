/**
 * 금주의 경주 섹션 — KRA 발매경주표 스타일 테이블
 */
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import RaceApi from '@/lib/api/raceApi';
import DataTable from '@/components/ui/DataTable';
import HomeSection from './HomeSection';
import { routes } from '@/lib/routes';
import { StatusBadge } from '@/components/ui';
import type { RaceDto } from '@/lib/types/race';
import type { RaceDetailDto } from '@goldenrace/shared';

function getWeekDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
  }
  return dates;
}

export default function WeekRacesSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['races', 'week'],
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

  const races = useMemo(() => (data ?? []).slice(0, 5), [data]);

  return (
    <HomeSection
      title='금주의 경주'
      icon='Calendar'
      viewAllHref={routes.races.list}
      viewAllLabel='전체보기'
    >
      {isLoading ? (
        <div className='py-8 text-center text-text-secondary text-sm'>경주 정보를 불러오는 중...</div>
      ) : races.length === 0 ? (
        <div className='py-8 text-center text-text-secondary text-sm'>이번 주 예정된 경주가 없습니다.</div>
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
              key: 'date',
              header: '날짜',
              headerClassName: 'w-20 cell-center',
              align: 'center',
              render: (row) => {
                const d = (row.rcDate ?? '').replace(/-/g, '');
                const str = d.length >= 8 ? `${d.slice(4, 6)}/${d.slice(6, 8)}` : '-';
                return <span className='text-text-secondary'>{str}</span>;
              },
            },
            {
              key: 'rcNo',
              header: '경주번호',
              headerClassName: 'w-20 cell-center',
              align: 'center',
              render: (row) => (
                <Link href={routes.races.detail(row.id)} className='text-primary font-semibold hover:underline'>
                  {row.rcNo}R
                </Link>
              ),
            },
            {
              key: 'dist',
              header: '거리',
              headerClassName: 'w-20 cell-center',
              align: 'center',
              render: (row) => (
                <span className='text-text-secondary'>{row.rcDist ? `${row.rcDist}M` : '-'}</span>
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
              key: 'detail',
              header: '상세',
              headerClassName: 'w-16 cell-center',
              align: 'center',
              render: (row) => (
                <Link href={routes.races.detail(row.id)} className='text-primary text-sm font-medium hover:underline'>
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
