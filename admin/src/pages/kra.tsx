import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { adminKraApi } from '@/lib/api/admin';
import { formatYyyyMmDd } from '@/lib/utils';
import { Database, RefreshCw, FileText, Trophy, User, Zap, History } from 'lucide-react';
import { AdminIcon } from '@/components/common/AdminIcon';
import LoadingSpinner from '@/components/common/LoadingSpinner';

function toYyyyMmDd(s: string): string {
  return s.replace(/-/g, '').slice(0, 8);
}

export default function KraPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const dateFromQuery = router.query.date as string | undefined;

  const [syncDate, setSyncDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (dateFromQuery && /^\d{8}$/.test(dateFromQuery)) {
      setSyncDate(
        `${dateFromQuery.slice(0, 4)}-${dateFromQuery.slice(4, 6)}-${dateFromQuery.slice(6, 8)}`
      );
    }
  }, [dateFromQuery]);
  const [histFrom, setHistFrom] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [histTo, setHistTo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [meetFilter, setMeetFilter] = useState('');
  const [logEndpointFilter, setLogEndpointFilter] = useState('');

  const syncScheduleMutation = useMutation({
    mutationFn: (date?: string) =>
      adminKraApi.syncSchedule(date ? toYyyyMmDd(date) : undefined),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['kra-sync-logs'] });
      const msg = (res as { message?: string })?.message;
      toast.success(msg ?? '출전표 동기화 완료 (경주 + 출전마 정보)');
    },
    onError: (err: unknown) => toast.error('동기화 실패'),
  });

  const syncResultsMutation = useMutation({
    mutationFn: (date?: string) =>
      adminKraApi.syncResults(date ? toYyyyMmDd(date) : undefined),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['kra-sync-logs'] });
      const msg = (res as { message?: string })?.message;
      toast.success(msg ?? '경주 결과 동기화 완료');
    },
    onError: (err: unknown) => toast.error('동기화 실패'),
  });

  const syncDetailsMutation = useMutation({
    mutationFn: (date: string) => adminKraApi.syncDetails(toYyyyMmDd(date)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kra-sync-logs'] });
      toast.success('상세정보(훈련·장구 등) 동기화 완료');
    },
    onError: (err: unknown) => toast.error( '동기화 실패'),
  });

  const syncJockeysMutation = useMutation({
    mutationFn: (meet?: string) => adminKraApi.syncJockeys(meet || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kra-sync-logs'] });
      toast.success('기수 통산전적 동기화 완료');
    },
    onError: (err: unknown) => toast.error( '동기화 실패'),
  });

  const syncAllMutation = useMutation({
    mutationFn: (date: string) => adminKraApi.syncAll(toYyyyMmDd(date)),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['kra-sync-logs'] });
      toast.success((res as { message?: string })?.message ?? '전체 적재 완료');
    },
    onError: (err: unknown) => toast.error( '전체 적재 실패'),
  });

  const seedSampleMutation = useMutation({
    mutationFn: (date?: string) => adminKraApi.seedSample(date ? toYyyyMmDd(date) : undefined),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['kra-sync-logs'] });
      const r = res as { races?: number; entries?: number };
      toast.success(`샘플 데이터 적재: ${r?.races ?? 0}경주, ${r?.entries ?? 0}출마`);
    },
    onError: (err: unknown) => toast.error( '샘플 적재 실패'),
  });

  const syncHistoricalMutation = useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) =>
      adminKraApi.syncHistorical(toYyyyMmDd(from), toYyyyMmDd(to)),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['kra-sync-logs'] });
      toast.success(`과거 데이터 적재 완료: ${(res as { processed?: number })?.processed ?? 0}일`);
    },
    onError: (err: unknown) => toast.error( '과거 데이터 적재 실패'),
  });

  const { data: kraStatus } = useQuery({
    queryKey: ['kra-status'],
    queryFn: () => adminKraApi.getStatus(),
  });

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['kra-sync-logs', logEndpointFilter, syncDate],
    queryFn: () =>
      adminKraApi.getSyncLogs({
        endpoint: logEndpointFilter || undefined,
        rcDate: syncDate ? toYyyyMmDd(syncDate) : undefined,
        limit: 30,
      }),
    refetchInterval: 10000,
  });

  return (
    <>
      <Head>
        <title>KRA 데이터 관리 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-6'>
          <PageHeader
            title='KRA 데이터 관리'
            description='한국마사회(KRA) 출전표·경주 결과·상세정보를 수동으로 동기화합니다. 출전마가 보이지 않을 때 날짜 선택 후 출전표를 먼저 실행하세요.'
          />

          {/* KRA 설정 상태 */}
          <Card title='KRA 설정 상태' description='현재 적용 중인 KRA API 설정'>
            <div className='flex flex-wrap gap-4 text-sm'>
              <div>
                <span className='text-gray-500'>API 키:</span>{' '}
                <span
                  className={`font-medium ${
                    kraStatus?.serviceKeyConfigured ? 'text-green-600' : 'text-amber-600'
                  }`}
                >
                  {kraStatus?.serviceKeyConfigured ? '설정됨' : '미설정 (.env)'}
                </span>
              </div>
              <div>
                <span className='text-gray-500'>Base URL:</span>{' '}
                <span className='font-mono text-xs break-all'>
                  {kraStatus?.baseUrlInUse || '-'}
                </span>
                {kraStatus?.baseUrlInUse?.includes('apis.data.go.kr') && (
                  <span className='ml-1 text-gray-400'>(기본값)</span>
                )}
              </div>
              <Link
                href='/settings'
                className='text-blue-600 hover:underline'
              >
                설정에서 Base URL 변경 →
              </Link>
            </div>
          </Card>

          {/* 출전표 수동 동기화 — 가장 핵심 */}
          <Card title='출전표 수동 동기화' description='경주별 출전마(말·기수·조교사) 정보를 KRA에서 가져옵니다. 웹앱에서 "출전마 정보가 없습니다"가 뜨면 이 버튼을 실행하세요.'>
            <div className='flex flex-wrap items-center gap-3'>
              <input
                type='date'
                value={syncDate}
                onChange={(e) => setSyncDate(e.target.value)}
                className='px-3 py-2 border border-gray-300 rounded-md text-sm'
              />
              <Button
                variant='primary'
                onClick={() => syncScheduleMutation.mutate(syncDate)}
                disabled={syncScheduleMutation.isPending}
                isLoading={syncScheduleMutation.isPending}
              >
                <AdminIcon icon={FileText} className='w-4 h-4 mr-1.5 inline' />
                출전표 동기화
              </Button>
              <span className='text-sm text-gray-500'>
                선택한 날짜의 경주 계획 + 출전마 적재
              </span>
            </div>
            <div className='mt-3 flex flex-wrap items-center gap-3'>
              <Button
                variant='ghost'
                onClick={() => syncScheduleMutation.mutate(undefined)}
                disabled={syncScheduleMutation.isPending}
                isLoading={syncScheduleMutation.isPending}
              >
                <AdminIcon icon={FileText} className='w-4 h-4 mr-1.5 inline' />
                미래 스케줄 전체 적재
              </Button>
              <span className='text-sm text-gray-500'>
                오늘부터 1년 내 금·토·일 경주 전체 출전표 적재
              </span>
            </div>
          </Card>

          {/* 기타 수동 동기화 */}
          <Card title='기타 KRA 동기화' description='경주 결과, 상세정보, 기수 전적 등을 개별 실행할 수 있습니다.'>
            <div className='flex flex-wrap items-center gap-3'>
              <input
                type='date'
                value={syncDate}
                onChange={(e) => setSyncDate(e.target.value)}
                className='px-3 py-2 border border-gray-300 rounded-md text-sm'
              />
              <Button
                variant='secondary'
                onClick={() => syncResultsMutation.mutate(syncDate)}
                disabled={syncResultsMutation.isPending}
                isLoading={syncResultsMutation.isPending}
              >
                <AdminIcon icon={Trophy} className='w-4 h-4 mr-1.5 inline' />
                경주 결과
              </Button>
              <Button
                variant='ghost'
                onClick={() => syncResultsMutation.mutate(undefined)}
                disabled={syncResultsMutation.isPending}
                isLoading={syncResultsMutation.isPending}
              >
                <AdminIcon icon={Trophy} className='w-4 h-4 mr-1.5 inline' />
                과거 1년 결과 적재
              </Button>
              <Button
                variant='secondary'
                onClick={() => syncDetailsMutation.mutate(syncDate)}
                disabled={syncDetailsMutation.isPending}
                isLoading={syncDetailsMutation.isPending}
              >
                <AdminIcon icon={Zap} className='w-4 h-4 mr-1.5 inline' />
                상세정보
              </Button>
              <Button
                variant='secondary'
                onClick={() => syncJockeysMutation.mutate(meetFilter || undefined)}
                disabled={syncJockeysMutation.isPending}
                isLoading={syncJockeysMutation.isPending}
              >
                <AdminIcon icon={User} className='w-4 h-4 mr-1.5 inline' />
                기수 전적
              </Button>
              <select
                value={meetFilter}
                onChange={(e) => setMeetFilter(e.target.value)}
                className='px-2 py-2 border border-gray-300 rounded-md text-sm'
              >
                <option value=''>전체</option>
                <option value='1'>서울</option>
                <option value='2'>부산경남</option>
                <option value='3'>제주</option>
              </select>
              <Button
                variant='primary'
                onClick={() => syncAllMutation.mutate(syncDate)}
                disabled={syncAllMutation.isPending}
                isLoading={syncAllMutation.isPending}
              >
                <AdminIcon icon={RefreshCw} className='w-4 h-4 mr-1.5 inline' />
                전체 적재
              </Button>
            </div>
          </Card>

          {/* 샘플 데이터 & 과거 적재 */}
          <Card title='개발·백업용' description='KRA API 키 없이 샘플 데이터 적재, 과거 기간 일괄 적재'>
            <div className='space-y-4'>
              <div className='flex flex-wrap items-center gap-3'>
                <input
                  type='date'
                  value={syncDate}
                  onChange={(e) => setSyncDate(e.target.value)}
                  className='px-3 py-2 border border-gray-300 rounded-md text-sm'
                />
                <Button
                  variant='ghost'
                  onClick={() => seedSampleMutation.mutate(syncDate)}
                  disabled={seedSampleMutation.isPending}
                  isLoading={seedSampleMutation.isPending}
                >
                  <AdminIcon icon={Database} className='w-4 h-4 mr-1.5 inline' />
                  샘플 경주 적재
                </Button>
                <span className='text-sm text-gray-500'>
                  KRA 키 없이 개발용 mock 데이터 생성
                </span>
              </div>
              <hr className='border-gray-200' />
              <div className='flex flex-wrap items-center gap-3'>
                <input
                  type='date'
                  value={histFrom}
                  onChange={(e) => setHistFrom(e.target.value)}
                  className='px-3 py-2 border border-gray-300 rounded-md text-sm'
                />
                <span className='text-gray-500'>~</span>
                <input
                  type='date'
                  value={histTo}
                  onChange={(e) => setHistTo(e.target.value)}
                  className='px-3 py-2 border border-gray-300 rounded-md text-sm'
                />
                <Button
                  variant='ghost'
                  onClick={() =>
                    syncHistoricalMutation.mutate({ from: histFrom, to: histTo })
                  }
                  disabled={
                    syncHistoricalMutation.isPending || !histFrom || !histTo
                  }
                  isLoading={syncHistoricalMutation.isPending}
                >
                  <AdminIcon icon={History} className='w-4 h-4 mr-1.5 inline' />
                  과거 데이터 적재
                </Button>
                <span className='text-sm text-gray-500'>
                  기간 내 경주 결과 백업
                </span>
              </div>
            </div>
          </Card>

          {/* 동기화 로그 */}
          <Card title='동기화 로그' description='최근 KRA API 호출 이력'>
            <div className='flex flex-wrap items-center gap-3 mb-4'>
              <input
                type='date'
                value={syncDate}
                onChange={(e) => setSyncDate(e.target.value)}
                className='px-3 py-2 border border-gray-300 rounded-md text-sm'
              />
              <select
                value={logEndpointFilter}
                onChange={(e) => setLogEndpointFilter(e.target.value)}
                className='px-3 py-2 border border-gray-300 rounded-md text-sm'
              >
                <option value=''>전체 엔드포인트</option>
                <option value='entrySheet'>entrySheet</option>
                <option value='raceResult'>raceResult</option>
                <option value='jockeyResult'>jockeyResult</option>
                <option value='trainerInfo'>trainerInfo</option>
                <option value='trackInfo'>trackInfo</option>
                <option value='raceHorseRating'>raceHorseRating</option>
                <option value='horseSectional'>horseSectional</option>
                <option value='horseWeight'>horseWeight</option>
                <option value='equipmentBleeding'>equipmentBleeding</option>
                <option value='horseCancel'>horseCancel</option>
              </select>
              <span className='text-sm text-gray-500'>날짜·엔드포인트로 필터</span>
            </div>
            {logsLoading ? (
              <div className='py-8 flex justify-center'>
                <LoadingSpinner size='md' label='동기화 로그 불러오는 중...' />
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200 text-sm'>
                  <thead>
                    <tr>
                      <th className='py-2 text-left font-medium text-gray-700'>시각</th>
                      <th className='py-2 text-left font-medium text-gray-700'>엔드포인트</th>
                      <th className='py-2 text-left font-medium text-gray-700'>경주장</th>
                      <th className='py-2 text-left font-medium text-gray-700'>날짜</th>
                      <th className='py-2 text-left font-medium text-gray-700'>상태</th>
                      <th className='py-2 text-right font-medium text-gray-700'>처리수</th>
                      <th className='py-2 text-right font-medium text-gray-700'>소요</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {(logsData?.logs ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className='py-8 text-center text-gray-500'>
                          로그가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      (logsData?.logs ?? []).map((log) => (
                        <tr key={log.id}>
                          <td className='py-2 text-gray-600'>
                            {log.createdAt
                              ? new Date(log.createdAt).toLocaleString('ko-KR')
                              : '-'}
                          </td>
                          <td className='py-2 font-mono text-xs'>{log.endpoint}</td>
                          <td className='py-2'>{log.meet ?? '-'}</td>
                          <td className='py-2'>
                            {log.rcDate ? formatYyyyMmDd(log.rcDate) : '-'}
                          </td>
                          <td className='py-2'>
                            <span
                              className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                                log.status === 'SUCCESS'
                                  ? 'bg-green-100 text-green-800'
                                  : log.status === 'FAILED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className='py-2 text-right'>{log.recordCount}</td>
                          <td className='py-2 text-right'>
                            {log.durationMs != null ? `${log.durationMs}ms` : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </Layout>
    </>
  );
}
