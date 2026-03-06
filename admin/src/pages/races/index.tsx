import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import Table from '@/components/common/Table';
import Pagination from '@/components/common/Pagination';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import PageHeader from '@/components/common/PageHeader';
import SyncProgressBar from '@/components/common/SyncProgressBar';
import { adminRacesApi, adminKraApi } from '@/lib/api/admin';
import { formatDate, getDisplayRaceStatus, getErrorMessage, getTodayKstDate } from '@/lib/utils';

interface RaceData {
  id: string;
  rcNo: string;
  rcName: string;
  rcDate: string;
  rcTime?: string;
  stTime?: string;
  meet: string;
  rcDist: string;
  rank?: string;
  status?: string;
  entries?: unknown[];
}

const MEET_OPTIONS = [
  { value: '', label: '전체' },
  { value: '서울', label: '서울' },
  { value: '제주', label: '제주' },
  { value: '부산경남', label: '부산' },
] as const;

const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'SCHEDULED', label: '예정' },
  { value: 'COMPLETED', label: '종료' },
] as const;


export default function RacesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [meetFilter, setMeetFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(() => getTodayKstDate());
  const [syncDate, setSyncDate] = useState(() => getTodayKstDate().replace(/-/g, ''));
  const [syncProgress, setSyncProgress] = useState<{ percent: number; message: string } | null>(null);

  const syncScheduleMutation = useMutation({
    mutationFn: async (date: string) => {
      const out = await adminKraApi.syncScheduleWithProgress(date, {
        onProgress: (p, m) => setSyncProgress({ percent: p, message: m }),
      });
      if (out.error) throw new Error(out.error);
      return out.result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      toast.success('출전표 동기화 완료');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
    onSettled: () => setSyncProgress(null),
  });

  const seedSampleMutation = useMutation({
    mutationFn: (date?: string) => adminKraApi.seedSample(date),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      const r = res as { races?: number; entries?: number };
      toast.success(`샘플 데이터 적재 완료: ${r?.races ?? 0}경주, ${r?.entries ?? 0}건`);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const syncResultsMutation = useMutation({
    mutationFn: async (date: string) => {
      const out = await adminKraApi.syncResultsWithProgress(date, {
        onProgress: (p, m) => setSyncProgress({ percent: p, message: m }),
      });
      if (out.error) throw new Error(out.error);
      return out.result;
    },
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      queryClient.invalidateQueries({ queryKey: ['admin-results'] });
      queryClient.invalidateQueries({ queryKey: ['race'] });
      const msg = (res as { result?: { message?: string } })?.result?.message ?? '경주 결과 동기화 완료';
      toast.success(msg);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
    onSettled: () => setSyncProgress(null),
  });

  const syncDetailsMutation = useMutation({
    mutationFn: (date: string) => adminKraApi.syncDetails(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      toast.success('상세정보(훈련·장구 등) 동기화 완료');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const syncAllMutation = useMutation({
    mutationFn: async (date: string) => {
      const out = await adminKraApi.syncAllWithProgress(date, {
        onProgress: (p, m) => setSyncProgress({ percent: p, message: m }),
      });
      if (out.error) throw new Error(out.error);
      return out.result;
    },
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      queryClient.invalidateQueries({ queryKey: ['admin-results'] });
      queryClient.invalidateQueries({ queryKey: ['race'] });
      const msg = (res as { message?: string })?.message ?? '전체 적재 완료';
      toast.success(msg);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
    onSettled: () => setSyncProgress(null),
  });


  const { data, isLoading, error: racesError, refetch: refetchRaces } = useQuery({
    queryKey: ['admin-races', page, meetFilter, statusFilter, dateFilter],
    queryFn: () =>
      adminRacesApi.getAll({
        page,
        limit: 20,
        ...(meetFilter && { meet: meetFilter }),
        ...(dateFilter && { date: dateFilter.replace(/-/g, '') }),
      }),
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000,
  });

  const allRaces = (data?.data || []) as RaceData[];
  const filteredRaces = statusFilter
    ? allRaces.filter((race: RaceData) => {
        const effectiveStatus = getDisplayRaceStatus(
          race.status,
          race.rcDate,
          race.stTime ?? race.rcTime,
        ) || 'SCHEDULED';
        const key = effectiveStatus.toUpperCase().replace(/-/g, '_');
        if (statusFilter === 'COMPLETED') return key === 'COMPLETED';
        if (statusFilter === 'SCHEDULED') return key !== 'COMPLETED';
        return true;
      })
    : allRaces;
  const hasActiveFilters = !!(meetFilter || statusFilter || dateFilter);

  const columns = [
    {
      key: 'rcNo',
      header: '경주번호',
      className: 'w-24',
      render: (race: RaceData) => `${race.rcNo}R`,
    },
    {
      key: 'rcName',
      header: '경주명',
    },
    {
      key: 'rcDate',
      header: '날짜',
      render: (race: RaceData) => {
        if (race.rcDate?.length === 8) {
          return `${race.rcDate.slice(0, 4)}-${race.rcDate.slice(4, 6)}-${race.rcDate.slice(6, 8)}`;
        }
        return race.rcDate;
      },
    },
    {
      key: 'rcTime',
      header: '시간',
      render: (race: RaceData) => race.rcTime || '-',
    },
    {
      key: 'meet',
      header: '경주장',
    },
    {
      key: 'rcDist',
      header: '거리',
      render: (race: RaceData) => `${race.rcDist}m`,
    },
    {
      key: 'entries',
      header: '출전마',
      className: 'w-20 text-center',
      render: (race: RaceData) => {
        const n = Array.isArray(race.entries) ? race.entries.length : 0;
        return n > 0 ? <span className='text-gray-700'>{n}마</span> : <span className='text-gray-400'>-</span>;
      },
    },
    {
      key: 'status',
      header: '상태',
        render: (race: RaceData) => {
        const statusColors: Record<string, string> = {
          SCHEDULED: 'bg-blue-100 text-blue-800',
          IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
          COMPLETED: 'bg-green-100 text-green-800',
          CANCELLED: 'bg-red-100 text-red-800',
        };
        const statusLabels: Record<string, string> = {
          SCHEDULED: '예정',
          IN_PROGRESS: '진행중',
          COMPLETED: '완료',
          CANCELLED: '취소',
        };
        // Show "완료" only when server says COMPLETED and race end time has passed (same as WebApp).
        const effectiveStatus = getDisplayRaceStatus(
          race.status,
          race.rcDate,
          race.stTime ?? race.rcTime,
        ) || 'SCHEDULED';
        const key = effectiveStatus.toUpperCase().replace(/-/g, '_');
        return (
          <span
            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
              statusColors[key] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {statusLabels[key] || effectiveStatus || '-'}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <Head>
        <title>경주 관리 | OddsCast Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader
            title='경주 관리'
            description='경주 일정·출전마·결과를 조회하고 KRA 데이터를 동기화합니다.'
          />
          <Card title='필터' className='mb-4'>
            <div className='flex flex-wrap items-end gap-3'>
              <div className='flex flex-col'>
                <label className='mb-1 block text-xs font-medium text-gray-500'>지역</label>
                <select
                  value={meetFilter}
                  onChange={(e) => {
                    setMeetFilter(e.target.value);
                    setPage(1);
                  }}
                  className='h-9 min-w-[120px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
                >
                  {MEET_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className='flex flex-col'>
                <label className='mb-1 block text-xs font-medium text-gray-500'>상태</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className='h-9 min-w-[120px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className='flex flex-col'>
                <label className='mb-1 block text-xs font-medium text-gray-500'>날짜</label>
                <input
                  type='date'
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setPage(1);
                  }}
                  className='h-9 min-w-[140px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
                />
              </div>
            </div>
          </Card>

          {/* KRA 동기화 — 간편 패널 */}
          <Card title='빠른 KRA 동기화' description='날짜 선택 후 필요한 데이터를 개별 또는 전체 동기화합니다. 자세한 설정은 KRA 데이터 관리 페이지를 이용하세요.'>
            <div className='space-y-4'>
              <div className='flex flex-wrap items-center gap-3'>
                <input
                  type='date'
                  value={
                    syncDate && syncDate.length >= 8
                      ? `${syncDate.slice(0, 4)}-${syncDate.slice(4, 6)}-${syncDate.slice(6, 8)}`
                      : ''
                  }
                  onChange={(e) => setSyncDate(e.target.value.replace(/-/g, ''))}
                  className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                />
                <Button
                  onClick={() =>
                    syncScheduleMutation.mutate(
                      syncDate ||
                        getTodayKstDate().replace(/-/g, '')
                    )
                  }
                  disabled={syncScheduleMutation.isPending}
                  isLoading={syncScheduleMutation.isPending}
                >
                  출전표
                </Button>
                <Button
                  variant='secondary'
                  onClick={() =>
                    syncResultsMutation.mutate(
                      syncDate ||
                        getTodayKstDate().replace(/-/g, '')
                    )
                  }
                  disabled={syncResultsMutation.isPending}
                  isLoading={syncResultsMutation.isPending}
                >
                  경주 결과
                </Button>
                <Button
                  variant='secondary'
                  onClick={() =>
                    syncDetailsMutation.mutate(
                      syncDate ||
                        getTodayKstDate().replace(/-/g, '')
                    )
                  }
                  disabled={syncDetailsMutation.isPending}
                  isLoading={syncDetailsMutation.isPending}
                >
                  상세정보
                </Button>
                <div className='flex flex-wrap items-center gap-3'>
                  <Button
                    variant='primary'
                    onClick={() =>
                      syncAllMutation.mutate(
                        syncDate ||
                          getTodayKstDate().replace(/-/g, '')
                      )
                    }
                    disabled={syncAllMutation.isPending}
                    isLoading={syncAllMutation.isPending}
                  >
                    전체 적재
                  </Button>
                  {syncProgress && (
                    <div className='min-w-[200px] flex-1 max-w-md'>
                      <SyncProgressBar percent={syncProgress.percent} message={syncProgress.message} />
                    </div>
                  )}
                </div>
              </div>
              <div className='flex flex-wrap items-center gap-4 text-sm text-gray-500'>
                <span>
                  <strong>출전표</strong> = 경주계획 + 출전마 |
                  <strong> 결과</strong> = 착순·기록·배당 |
                  <strong> 상세</strong> = 훈련·장구·마체중 |
                  <strong> 전체</strong> = 모두 한 번에
                </span>
                <Link href='/kra' className='text-indigo-600 hover:underline ml-auto shrink-0'>
                  KRA 관리 페이지로 →
                </Link>
              </div>
            </div>
          </Card>

          <Card>
            {racesError && (
              <div className='mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
                <p>경주 목록을 불러오는 중 오류가 발생했습니다.</p>
                <Button
                  type='button'
                  variant='secondary'
                  size='sm'
                  className='mt-2'
                  onClick={() => refetchRaces()}
                >
                  다시 시도
                </Button>
              </div>
            )}
            <Table
              data={filteredRaces}
              columns={columns}
              isLoading={isLoading}
              emptyMessage={hasActiveFilters ? '선택한 조건에 맞는 경주가 없습니다. 필터를 바꿔 보세요.' : '경주가 없습니다. 날짜를 선택하거나 KRA 동기화를 실행하세요.'}
              onRowClick={(race) => router.push(`/races/${race.id}`)}
            />

            {data && (
              <Pagination
                currentPage={page}
                totalPages={data.meta.totalPages}
                onPageChange={setPage}
              />
            )}
          </Card>
        </div>
      </Layout>
    </>
  );
}
