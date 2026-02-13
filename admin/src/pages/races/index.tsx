import { useState } from 'react';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import Table from '@/components/common/Table';
import Pagination from '@/components/common/Pagination';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import PageHeader from '@/components/common/PageHeader';
import { adminRacesApi, adminKraApi } from '@/lib/api/admin';
import { formatDate } from '@/lib/utils';

interface RaceData {
  id: string;
  rcNo: string;
  rcName: string;
  rcDate: string;
  rcTime?: string;
  meet: string;
  rcDist: string;
  rank?: string;
  status?: string;
}

export default function RacesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedRace, setSelectedRace] = useState<RaceData | null>(null);
  const [syncDate, setSyncDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  });

  const syncScheduleMutation = useMutation({
    mutationFn: (date: string) => adminKraApi.syncSchedule(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      toast.success('출전표 동기화 완료');
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : '동기화 실패'),
  });

  const seedSampleMutation = useMutation({
    mutationFn: (date?: string) => adminKraApi.seedSample(date),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      const r = res as { races?: number; entries?: number };
      toast.success(`샘플 데이터 적재 완료: ${r?.races ?? 0}경주, ${r?.entries ?? 0}건`);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : '샘플 적재 실패'),
  });

  const syncResultsMutation = useMutation({
    mutationFn: (date: string) => adminKraApi.syncResults(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      toast.success('경주 결과 동기화 완료');
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : '동기화 실패'),
  });

  const syncDetailsMutation = useMutation({
    mutationFn: (date: string) => adminKraApi.syncDetails(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      toast.success('상세정보(훈련·장구 등) 동기화 완료');
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : '동기화 실패'),
  });

  const syncAllMutation = useMutation({
    mutationFn: (date: string) => adminKraApi.syncAll(date),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      toast.success((res as { message?: string })?.message ?? '전체 적재 완료');
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : '전체 적재 실패'),
  });

  const [histFrom, setHistFrom] = useState('20230101');
  const [histTo, setHistTo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  });
  const syncHistoricalMutation = useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) =>
      adminKraApi.syncHistorical(from, to),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      const r = res as { processed?: number; totalResults?: number };
      toast.success(`과거 데이터 적재 완료: ${r?.processed ?? 0}일, ${r?.totalResults ?? 0}건 결과`);
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : '과거 데이터 적재 실패'),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-races', page],
    queryFn: () => adminRacesApi.getAll({ page, limit: 20 }),
    placeholderData: (previousData) => previousData, // 이전 데이터 유지 (깜빡임 방지)
    staleTime: 2 * 60 * 1000, // 2분
  });

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
        const key = (race.status || '').toUpperCase().replace(/-/g, '_');
        return (
          <span
            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
              statusColors[key] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {statusLabels[key] || race.status || '-'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '작업',
      render: (race: RaceData) => (
        <div className='flex gap-2'>
          <Button size='sm' variant='ghost' onClick={() => setSelectedRace(race)}>
            상세
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>경주 관리 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader
            title='경주 관리'
            description='경주 일정과 정보를 관리할 수 있습니다.'
          />

          {/* KRA 동기화 */}
          <Card>
            <h3 className='font-semibold mb-4'>경주 정보 갱신 (KRA 동기화)</h3>
            <div className='flex flex-wrap items-center gap-3'>
              <input
                type='date'
                value={
                  syncDate && syncDate.length >= 8
                    ? `${syncDate.slice(0, 4)}-${syncDate.slice(4, 6)}-${syncDate.slice(6, 8)}`
                    : ''
                }
                onChange={(e) => setSyncDate(e.target.value.replace(/-/g, ''))}
                className='px-3 py-2 border rounded-md'
              />
              <Button
                onClick={() =>
                  syncScheduleMutation.mutate(
                    syncDate ||
                      `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`
                  )
                }
                disabled={syncScheduleMutation.isPending}
              >
                {syncScheduleMutation.isPending ? '동기화 중...' : '출전표'}
              </Button>
              <Button
                variant='secondary'
                onClick={() =>
                  syncResultsMutation.mutate(
                    syncDate ||
                      `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`
                  )
                }
                disabled={syncResultsMutation.isPending}
              >
                {syncResultsMutation.isPending ? '동기화 중...' : '경주 결과'}
              </Button>
              <Button
                variant='secondary'
                onClick={() =>
                  syncDetailsMutation.mutate(
                    syncDate ||
                      `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`
                  )
                }
                disabled={syncDetailsMutation.isPending}
              >
                {syncDetailsMutation.isPending ? '동기화 중...' : '상세정보'}
              </Button>
              <Button
                variant='primary'
                onClick={() =>
                  syncAllMutation.mutate(
                    syncDate ||
                      `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`
                  )
                }
                disabled={syncAllMutation.isPending}
              >
                {syncAllMutation.isPending ? '적재 중...' : '전체 적재'}
              </Button>
            </div>
            <p className='mt-2 text-sm text-gray-500'>
              날짜 선택 후: 출전표·경주 결과·상세정보 각각 동기화 또는 전체 적재(한 번에 모두). KRA_SERVICE_KEY 필요.
            </p>

            <hr className='my-4' />
            <h4 className='font-medium mb-3 text-gray-700'>
              개발용: 샘플 데이터 적재 (KRA 키 없이 사용)
            </h4>
            <div className='flex flex-wrap items-center gap-3'>
              <Button
                variant='secondary'
                onClick={() => seedSampleMutation.mutate(syncDate || undefined)}
                disabled={seedSampleMutation.isPending}
              >
                {seedSampleMutation.isPending ? '적재 중...' : '샘플 경주 적재'}
              </Button>
              <span className='text-sm text-gray-500'>
                위 날짜 기준으로 서울·부산 각 4경주, 경주당 5마리 출전마 생성
              </span>
            </div>

            <hr className='my-4' />
            <h4 className='font-medium mb-3 text-gray-700'>과거 데이터 적재 (KRA 누락 대비)</h4>
            <div className='flex flex-wrap items-center gap-3'>
              <input
                type='date'
                value={
                  histFrom.length >= 8
                    ? `${histFrom.slice(0, 4)}-${histFrom.slice(4, 6)}-${histFrom.slice(6, 8)}`
                    : ''
                }
                onChange={(e) => setHistFrom(e.target.value.replace(/-/g, ''))}
                className='px-3 py-2 border rounded-md'
              />
              <span className='text-gray-500'>~</span>
              <input
                type='date'
                value={
                  histTo.length >= 8
                    ? `${histTo.slice(0, 4)}-${histTo.slice(4, 6)}-${histTo.slice(6, 8)}`
                    : ''
                }
                onChange={(e) => setHistTo(e.target.value.replace(/-/g, ''))}
                className='px-3 py-2 border rounded-md'
              />
              <Button
                variant='secondary'
                onClick={() =>
                  syncHistoricalMutation.mutate({ from: histFrom, to: histTo })
                }
                disabled={
                  syncHistoricalMutation.isPending || !histFrom || !histTo
                }
              >
                {syncHistoricalMutation.isPending
                  ? '적재 중...'
                  : '과거 데이터 적재'}
              </Button>
            </div>
            <p className='mt-2 text-sm text-gray-500'>
              기간 선택 후 경주 결과를 DB에 백업합니다. KRA API 장애·누락 시 복구에 유리합니다.
            </p>
          </Card>

          <Card>
            <Table
              data={data?.data || []}
              columns={columns}
              isLoading={isLoading}
              emptyMessage='경주가 없습니다.'
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

        {/* 경주 상세 모달 */}
        {selectedRace && (
          <Modal
            open
            onClose={() => setSelectedRace(null)}
            title='경주 상세 정보'
          >
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      경주 번호
                    </label>
                    <div className='text-gray-900 text-lg font-semibold'>{selectedRace.rcNo}R</div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>경주장</label>
                    <div className='text-gray-900'>{selectedRace.meet}</div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>경주일</label>
                    <div className='text-gray-900'>
                      {selectedRace.rcDate?.length === 8
                        ? `${selectedRace.rcDate.slice(0, 4)}-${selectedRace.rcDate.slice(
                            4,
                            6
                          )}-${selectedRace.rcDate.slice(6, 8)}`
                        : selectedRace.rcDate}
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>시간</label>
                    <div className='text-gray-900'>{selectedRace.rcTime || '-'}</div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>거리</label>
                    <div className='text-gray-900'>{selectedRace.rcDist}m</div>
                  </div>
                  {selectedRace.rank && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>등급</label>
                      <div className='text-gray-900'>{selectedRace.rank}</div>
                    </div>
                  )}
                </div>

                <div className='border-t pt-4'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>경주명</label>
                  <div className='text-gray-900 text-lg font-semibold'>{selectedRace.rcName}</div>
                </div>

                <div className='border-t pt-4 flex gap-2'>
                  <Button variant='ghost' className='flex-1' onClick={() => setSelectedRace(null)}>
                    닫기
                  </Button>
                </div>
              </div>
          </Modal>
        )}
      </Layout>
    </>
  );
}
