/**
 * All races preview section — KRA race schedule style table
 */
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import RaceApi from '@/lib/api/raceApi';
import DataTable from '@/components/ui/DataTable';
import HomeSection from './HomeSection';
import FilterDateBar from '@/components/page/FilterDateBar';
import { routes } from '@/lib/routes';
import DataFetchState from '@/components/page/DataFetchState';
import { StatusBadge } from '@/components/ui';
import { getTodayKstDate } from '@/lib/utils/format';
import type { RaceDto } from '@/lib/types/race';
import type { RaceDetailDto } from '@oddscast/shared';

const PREVIEW_LIMIT = 10;

export default function AllRacesSection() {
  const router = useRouter();
  const [dateFilter, setDateFilter] = useState<string>('');
  const [meetFilter, setMeetFilter] = useState<string>('');

  useEffect(() => {
    const q = router.query?.date as string | undefined;
    const qMeet = router.query?.meet as string | undefined;
    const updater = () => {
      if (q === 'today') setDateFilter('today');
      else if (q && /^\d{4}-?\d{2}-?\d{2}$/.test(q.replace(/-/g, ''))) {
        const normalized = q.includes('-') ? q : `${q.slice(0, 4)}-${q.slice(4, 6)}-${q.slice(6, 8)}`;
        setDateFilter(normalized);
      }
      if (qMeet !== undefined) setMeetFilter(qMeet || '');
    };
    queueMicrotask(updater);
  }, [router.query?.date, router.query?.meet]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['races', 'all', dateFilter, meetFilter],
    placeholderData: keepPreviousData,
    queryFn: () => {
      let date: string | undefined;
      if (dateFilter === 'today') {
        const kst = getTodayKstDate();
        date = `${kst.year}${String(kst.month).padStart(2, '0')}${String(kst.day).padStart(2, '0')}`;
      } else {
        date = dateFilter || undefined;
      }
      return RaceApi.getRaces({
        limit: PREVIEW_LIMIT,
        page: 1,
        ...(date && { date }),
        ...(meetFilter && { meet: meetFilter }),
      });
    },
  });

  const races = (data?.races ?? []) as RaceDto[];

  return (
    <HomeSection
      title='전체 경주'
      icon='ClipboardList'
      viewAllHref={routes.races.list}
      viewAllLabel='더보기'
    >
      <FilterDateBar
        filterOptions={[
          { value: '', label: '전체' },
          { value: 'today', label: '오늘' },
        ]}
        filterValue={dateFilter === 'today' ? 'today' : dateFilter || ''}
        onFilterChange={(v) => setDateFilter(v)}
        dateValue={dateFilter && dateFilter !== 'today' ? dateFilter : ''}
        onDateChange={(v) => setDateFilter(v || '')}
        dateId='all-race-date'
        showMeetFilter
        meetValue={meetFilter}
        onMeetChange={(v) => {
          setMeetFilter(v);
          router.replace(
            { pathname: router.pathname, query: { ...router.query, meet: v || undefined } },
            undefined,
            { shallow: true }
          );
        }}
        inline
      />

      <DataFetchState
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        isEmpty={!races.length}
        emptyIcon='Flag'
        emptyTitle='진행 중인 경주가 없습니다'
        emptyDescription='다른 날짜를 선택해주세요.'
        loadingLabel='경주 정보 준비 중...'
        errorTitle='경주 정보를 확인할 수 없습니다'
      >
        {/* Mobile: card list */}
        <div className='block sm:hidden divide-y divide-border -mx-0.5'>
          {races.map((row) => {
            const d = (row.rcDate ?? '').replace(/-/g, '');
            const dateStr = d.length >= 8 ? `${d.slice(4, 6)}/${d.slice(6, 8)}` : '';
            const detail = row as RaceDetailDto;
            const entryCount = (detail.entries ?? detail.entryDetails ?? []).length;
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
                    {dateStr && <span>{dateStr}</span>}
                    {row.rcDist && <span>{row.rcDist}M</span>}
                    {entryCount > 0 && <span>{entryCount}두</span>}
                    {row.stTime && <span>{row.stTime}</span>}
                  </div>
                </div>
                <StatusBadge
                  status={row.status ?? row.raceStatus ?? ''}
                  rcDate={row.rcDate}
                  stTime={row.stTime}
                />
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
                key: 'meet',
                header: '지역',
                headerClassName: 'w-16 text-center',
                align: 'center',
                render: (row) => (
                  <span className='font-medium text-foreground'>
                    {row.meetName ?? row.meet ?? '-'}
                  </span>
                ),
              },
              {
                key: 'date',
                header: '날짜',
                headerClassName: 'w-20 text-center',
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
                headerClassName: 'w-20 text-center',
                align: 'center',
                render: (row) => (
                  <Link
                    href={routes.races.detail(row.id)}
                    className='text-stone-700 font-semibold hover:underline'
                  >
                    {row.rcNo}R
                  </Link>
                ),
              },
              {
                key: 'dist',
                header: '거리',
                headerClassName: 'w-20 text-center',
                align: 'center',
                render: (row) => (
                  <Link href={routes.races.detail(row.id)} className='text-stone-700 hover:underline'>
                    {row.rcDist ? `${row.rcDist}M` : '-'}
                  </Link>
                ),
              },
              {
                key: 'entries',
                header: '출전',
                headerClassName: 'w-14 text-center',
                align: 'center',
                render: (row) => {
                  const detail = row as RaceDetailDto;
                  const entries = detail.entries ?? detail.entryDetails ?? [];
                  const count = entries.length;
                  return (
                    <span className='text-text-secondary'>{count > 0 ? `${count}두` : '-'}</span>
                  );
                },
              },
              {
                key: 'status',
                header: '상태',
                headerClassName: 'w-20 text-center',
                align: 'center',
                render: (row) => (
                  <StatusBadge
                    status={row.status ?? row.raceStatus ?? ''}
                    rcDate={row.rcDate}
                    stTime={row.stTime}
                  />
                ),
              },
              {
                key: 'detail',
                header: '상세',
                headerClassName: 'w-16 text-center',
                align: 'center',
                render: (row) => (
                  <Link
                    href={routes.races.detail(row.id)}
                    className='text-stone-700 text-sm font-medium hover:underline'
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
        </div>
      </DataFetchState>
    </HomeSection>
  );
}
