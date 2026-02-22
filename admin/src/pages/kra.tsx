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
import {
  Database, RefreshCw, FileText, Trophy, User, Zap, History,
  Info, Clock, CheckCircle2, AlertTriangle, Calendar, Server,
} from 'lucide-react';
import { AdminIcon } from '@/components/common/AdminIcon';
import LoadingSpinner from '@/components/common/LoadingSpinner';

function toYyyyMmDd(s: string): string {
  return s.replace(/-/g, '').slice(0, 8);
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  if (err instanceof Error) return err.message;
  return String(err) || '오류가 발생했습니다';
}

function HelpBox({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'warning' | 'success' }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };
  const icons = {
    info: <AdminIcon icon={Info} className='w-4 h-4 shrink-0 mt-0.5' />,
    warning: <AdminIcon icon={AlertTriangle} className='w-4 h-4 shrink-0 mt-0.5' />,
    success: <AdminIcon icon={CheckCircle2} className='w-4 h-4 shrink-0 mt-0.5' />,
  };
  return (
    <div className={`flex gap-2.5 p-3 rounded-lg border text-sm leading-relaxed ${styles[variant]}`}>
      {icons[variant]}
      <div className='flex-1'>{children}</div>
    </div>
  );
}

function StepBadge({ step }: { step: number }) {
  return (
    <span className='inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0'>
      {step}
    </span>
  );
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
  const [scheduleYear, setScheduleYear] = useState(() => new Date().getFullYear());

  const syncScheduleMutation = useMutation({
    mutationFn: (params?: { date?: string; year?: number }) =>
      adminKraApi.syncSchedule(
        params?.year != null
          ? { year: params.year }
          : params?.date
            ? { date: toYyyyMmDd(params.date) }
            : undefined,
      ),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['kra-sync-logs'] });
      const msg = (res as { message?: string })?.message;
      const data = res as { races?: number; monthsProcessed?: number };
      if (data?.monthsProcessed != null) {
        toast.success(msg ?? `${data.races ?? 0}건 경주계획표 적재 완료 (${data.monthsProcessed}개월)`);
      } else {
        toast.success(msg ?? '출전표 동기화 완료 (경주 + 출전마 정보)');
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const syncResultsMutation = useMutation({
    mutationFn: (date?: string) =>
      adminKraApi.syncResults(date ? toYyyyMmDd(date) : undefined),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['kra-sync-logs'] });
      const msg = (res as { message?: string })?.message;
      toast.success(msg ?? '경주 결과 동기화 완료');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const syncDetailsMutation = useMutation({
    mutationFn: (date: string) => adminKraApi.syncDetails(toYyyyMmDd(date)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kra-sync-logs'] });
      toast.success('상세정보(훈련·장구 등) 동기화 완료');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const syncJockeysMutation = useMutation({
    mutationFn: (meet?: string) => adminKraApi.syncJockeys(meet || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kra-sync-logs'] });
      toast.success('기수 통산전적 동기화 완료');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const syncAllMutation = useMutation({
    mutationFn: (date: string) => adminKraApi.syncAll(toYyyyMmDd(date)),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['kra-sync-logs'] });
      toast.success((res as { message?: string })?.message ?? '전체 적재 완료');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const seedSampleMutation = useMutation({
    mutationFn: (date?: string) => adminKraApi.seedSample(date ? toYyyyMmDd(date) : undefined),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['kra-sync-logs'] });
      const r = res as { races?: number; entries?: number };
      toast.success(`샘플 데이터 적재: ${r?.races ?? 0}경주, ${r?.entries ?? 0}출마`);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const syncHistoricalMutation = useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) =>
      adminKraApi.syncHistorical(toYyyyMmDd(from), toYyyyMmDd(to)),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['kra-sync-logs'] });
      toast.success(`과거 데이터 적재 완료: ${(res as { processed?: number })?.processed ?? 0}일`);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
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

  const isAnyPending =
    syncScheduleMutation.isPending ||
    syncResultsMutation.isPending ||
    syncDetailsMutation.isPending ||
    syncJockeysMutation.isPending ||
    syncAllMutation.isPending ||
    seedSampleMutation.isPending ||
    syncHistoricalMutation.isPending;

  return (
    <>
      <Head>
        <title>KRA 데이터 관리 | OddsCast Admin</title>
      </Head>
      <Layout>
        <div className='space-y-6'>
          <PageHeader
            title='KRA 데이터 관리'
            description='한국마사회(KRA) OpenAPI를 통해 경주 일정, 출전마, 결과 데이터를 가져옵니다.'
          />

          {/* 자동 동기화 안내 */}
          <Card title='자동 동기화 현황' description='서버 Cron이 주기적으로 데이터를 동기화합니다'>
            <div className='space-y-3'>
              <HelpBox variant='info'>
                <strong>자동 동기화는 별도 조작 없이 동작합니다.</strong> 아래는 현재 등록된 스케줄입니다.
                수동 동기화는 자동화로 누락된 데이터를 보충할 때만 사용하세요.
              </HelpBox>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                {[
                  { time: '매주 월 03:00', label: '미래 경주 계획표', desc: 'API72_2 — 1년 내 금·토·일 경주 일정', icon: Calendar },
                  { time: '매주 수·목 18:00', label: '주말 출전표', desc: 'API72_2 + API26_2 — 금·토·일 출전마', icon: FileText },
                  { time: '매일 17:30', label: '경주 결과', desc: '당일 결과 + 배당금', icon: Trophy },
                  { time: '매일 18:00', label: '상세정보', desc: '훈련기록, 장구, 마체중', icon: Zap },
                  { time: '매주 월 02:00', label: '기수 전적', desc: '기수별 통산 성적 갱신', icon: User },
                ].map((item) => (
                  <div key={item.label} className='flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200'>
                    <AdminIcon icon={item.icon} className='w-5 h-5 text-indigo-500 shrink-0 mt-0.5' />
                    <div>
                      <p className='font-medium text-gray-900 text-sm'>{item.label}</p>
                      <p className='text-gray-500 text-xs mt-0.5'>{item.desc}</p>
                      <p className='text-indigo-600 text-xs font-medium mt-1 flex items-center gap-1'>
                        <AdminIcon icon={Clock} className='w-3 h-3' />
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* KRA 설정 상태 */}
          <Card title='KRA API 연결 상태' description='서버에 설정된 KRA OpenAPI 키와 엔드포인트'>
            <div className='flex flex-wrap gap-4 text-sm items-center'>
              <div className='flex items-center gap-2'>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  kraStatus?.serviceKeyConfigured
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  <AdminIcon
                    icon={kraStatus?.serviceKeyConfigured ? CheckCircle2 : AlertTriangle}
                    className='w-3.5 h-3.5'
                  />
                  API 키: {kraStatus?.serviceKeyConfigured ? '정상' : '미설정'}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <AdminIcon icon={Server} className='w-4 h-4 text-gray-400' />
                <span className='font-mono text-xs text-gray-600 break-all'>
                  {kraStatus?.baseUrlInUse || '-'}
                </span>
                {kraStatus?.baseUrlInUse?.includes('apis.data.go.kr') && (
                  <span className='text-xs text-gray-400'>(기본값)</span>
                )}
              </div>
              <Link href='/settings' className='text-blue-600 hover:underline text-sm ml-auto'>
                설정 변경 →
              </Link>
            </div>
            {!kraStatus?.serviceKeyConfigured && (
              <HelpBox variant='warning'>
                KRA API 키가 설정되지 않았습니다. <code className='bg-amber-100 px-1 rounded'>.env</code> 파일에{' '}
                <code className='bg-amber-100 px-1 rounded'>KRA_SERVICE_KEY</code>를 추가한 후 서버를 재시작하세요.
              </HelpBox>
            )}
          </Card>

          {/* 날짜 선택 공통 영역 */}
          <div className='bg-indigo-50 border border-indigo-200 rounded-xl p-4'>
            <div className='flex flex-wrap items-center gap-3'>
              <AdminIcon icon={Calendar} className='w-5 h-5 text-indigo-600' />
              <span className='font-medium text-indigo-900'>작업 기준 날짜</span>
              <input
                type='date'
                value={syncDate}
                onChange={(e) => setSyncDate(e.target.value)}
                className='px-3 py-2 border border-indigo-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none'
              />
              <span className='text-indigo-600 text-sm'>
                아래 모든 수동 동기화에 이 날짜가 적용됩니다
              </span>
            </div>
          </div>

          {/* STEP 1: 경주 계획 + 출전표 */}
          <Card
            title={
              <span className='flex items-center gap-2'>
                <StepBadge step={1} />
                경주 일정 & 출전표 동기화
              </span>
            }
            description='가장 먼저 실행해야 하는 핵심 동기화. 경주 일정(API72_2)과 출전마(API26_2)를 함께 가져옵니다.'
          >
            <div className='space-y-4'>
              <HelpBox variant='info'>
                <strong>언제 사용하나요?</strong>
                <ul className='mt-1 space-y-1 list-disc list-inside'>
                  <li>웹앱에서 <strong>&quot;출전마 정보가 없습니다&quot;</strong>가 표시될 때</li>
                  <li>새로운 경주일이 추가되었는데 반영이 안 되었을 때</li>
                  <li>Cron 자동 동기화가 누락된 경우 수동 보충</li>
                </ul>
              </HelpBox>
              <div className='flex flex-wrap items-center gap-3'>
                <Button
                  variant='primary'
                  onClick={() => syncScheduleMutation.mutate({ date: syncDate })}
                  disabled={isAnyPending}
                  isLoading={syncScheduleMutation.isPending}
                >
                  <AdminIcon icon={FileText} className='w-4 h-4 mr-1.5 inline' />
                  선택일 출전표 동기화
                </Button>
                <span className='text-sm text-gray-500'>
                  {syncDate} 경주계획표 + 출전마 적재
                </span>
              </div>
              <hr className='border-gray-200' />
              <div className='flex flex-wrap items-center gap-3'>
                <Button
                  variant='ghost'
                  onClick={() => syncScheduleMutation.mutate(undefined)}
                  disabled={isAnyPending}
                  isLoading={syncScheduleMutation.isPending}
                >
                  <AdminIcon icon={Calendar} className='w-4 h-4 mr-1.5 inline' />
                  미래 스케줄 전체 적재
                </Button>
                <span className='text-sm text-gray-500'>
                  오늘부터 1년 내 금·토·일 경주 전체 적재 (소요시간: 수분)
                </span>
              </div>
              <hr className='border-gray-200' />
              <div className='flex flex-wrap items-center gap-3'>
                <label className='text-sm text-gray-600'>연도</label>
                <input
                  type='number'
                  min={2020}
                  max={2030}
                  value={scheduleYear}
                  onChange={(e) => setScheduleYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
                  className='w-20 px-2 py-1.5 border border-gray-300 rounded text-sm'
                />
                <Button
                  variant='secondary'
                  onClick={() => syncScheduleMutation.mutate({ year: scheduleYear })}
                  disabled={isAnyPending}
                  isLoading={syncScheduleMutation.isPending}
                >
                  <AdminIcon icon={Calendar} className='w-4 h-4 mr-1.5 inline' />
                  연도별 경주계획표 적재
                </Button>
                <span className='text-sm text-gray-500'>
                  해당 연도 1~12월 시행일만 적재 (웹앱 시행일 달력용, 출전표 미포함)
                </span>
              </div>
            </div>
          </Card>

          {/* STEP 2: 경주 결과 */}
          <Card
            title={
              <span className='flex items-center gap-2'>
                <StepBadge step={2} />
                경주 결과 동기화
              </span>
            }
            description='경주 종료 후 착순, 기록, 배당금 데이터를 가져옵니다. 경주 당일 17:30 이후 자동 실행됩니다.'
          >
            <div className='space-y-4'>
              <HelpBox variant='info'>
                <strong>언제 사용하나요?</strong>
                <ul className='mt-1 space-y-1 list-disc list-inside'>
                  <li>경주 종료 후 결과가 안 보일 때</li>
                  <li>자동 Cron이 실행되기 전 결과를 빠르게 확인하고 싶을 때</li>
                </ul>
              </HelpBox>
              <div className='flex flex-wrap items-center gap-3'>
                <Button
                  variant='secondary'
                  onClick={() => syncResultsMutation.mutate(syncDate)}
                  disabled={isAnyPending}
                  isLoading={syncResultsMutation.isPending}
                >
                  <AdminIcon icon={Trophy} className='w-4 h-4 mr-1.5 inline' />
                  선택일 결과 동기화
                </Button>
                <Button
                  variant='ghost'
                  onClick={() => syncResultsMutation.mutate(undefined)}
                  disabled={isAnyPending}
                  isLoading={syncResultsMutation.isPending}
                >
                  <AdminIcon icon={Trophy} className='w-4 h-4 mr-1.5 inline' />
                  과거 1년 결과 적재
                </Button>
              </div>
            </div>
          </Card>

          {/* STEP 3: 상세 정보 & 기수 */}
          <Card
            title={
              <span className='flex items-center gap-2'>
                <StepBadge step={3} />
                부가 정보 동기화
              </span>
            }
            description='상세정보(훈련기록·장구·마체중), 기수 통산전적 등 AI 분석에 필요한 보조 데이터를 가져옵니다.'
          >
            <div className='space-y-4'>
              <HelpBox variant='info'>
                <strong>상세정보</strong>는 해당일 경주의 훈련기록, 장구(차안대·혀묶개 등), 마체중 변화 데이터입니다.
                <strong> 기수 전적</strong>은 경마장별 기수의 통산 출전/승리 기록입니다.
              </HelpBox>
              <div className='flex flex-wrap items-center gap-3'>
                <Button
                  variant='secondary'
                  onClick={() => syncDetailsMutation.mutate(syncDate)}
                  disabled={isAnyPending}
                  isLoading={syncDetailsMutation.isPending}
                >
                  <AdminIcon icon={Zap} className='w-4 h-4 mr-1.5 inline' />
                  상세정보 동기화
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => syncJockeysMutation.mutate(meetFilter || undefined)}
                  disabled={isAnyPending}
                  isLoading={syncJockeysMutation.isPending}
                >
                  <AdminIcon icon={User} className='w-4 h-4 mr-1.5 inline' />
                  기수 전적 동기화
                </Button>
                <select
                  value={meetFilter}
                  onChange={(e) => setMeetFilter(e.target.value)}
                  className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                >
                  <option value=''>전체 경마장</option>
                  <option value='1'>서울</option>
                  <option value='2'>부산경남</option>
                  <option value='3'>제주</option>
                </select>
              </div>
            </div>
          </Card>

          {/* 전체 적재 */}
          <Card
            title={
              <span className='flex items-center gap-2'>
                <AdminIcon icon={RefreshCw} className='w-5 h-5 text-indigo-600' />
                전체 한 번에 적재
              </span>
            }
            description='위 1~3단계를 한 번에 실행합니다. 선택한 날짜의 경주계획 + 출전표 + 결과 + 상세정보를 모두 가져옵니다.'
          >
            <div className='space-y-3'>
              <HelpBox variant='warning'>
                모든 API를 순차 호출하므로 <strong>1~2분 이상 소요</strong>될 수 있습니다.
                특정 데이터만 필요하면 위 개별 버튼을 사용하세요.
              </HelpBox>
              <div className='flex flex-wrap items-center gap-3'>
                <Button
                  variant='primary'
                  onClick={() => syncAllMutation.mutate(syncDate)}
                  disabled={isAnyPending}
                  isLoading={syncAllMutation.isPending}
                >
                  <AdminIcon icon={RefreshCw} className='w-4 h-4 mr-1.5 inline' />
                  {syncDate} 전체 적재
                </Button>
              </div>
            </div>
          </Card>

          {/* 개발·백업용 */}
          <details className='group'>
            <summary className='cursor-pointer py-3 px-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-between'>
              <span className='text-gray-700 font-medium flex items-center gap-2'>
                <AdminIcon icon={Database} className='w-4 h-4' />
                개발·백업용 도구
              </span>
              <span className='text-gray-400 text-xs group-open:hidden'>펼치기 ▼</span>
              <span className='text-gray-400 text-xs hidden group-open:inline'>접기 ▲</span>
            </summary>
            <div className='mt-3'>
              <Card title='샘플 데이터 & 과거 적재' description='KRA API 키 없이 개발용 mock 데이터를 생성하거나, 과거 기간의 경주 결과를 일괄 적재합니다.'>
                <div className='space-y-4'>
                  <div className='flex flex-wrap items-center gap-3'>
                    <Button
                      variant='ghost'
                      onClick={() => seedSampleMutation.mutate(syncDate)}
                      disabled={isAnyPending}
                      isLoading={seedSampleMutation.isPending}
                    >
                      <AdminIcon icon={Database} className='w-4 h-4 mr-1.5 inline' />
                      샘플 경주 적재
                    </Button>
                    <span className='text-sm text-gray-500'>
                      KRA 키 없이 개발/테스트용 mock 데이터 생성
                    </span>
                  </div>
                  <hr className='border-gray-200' />
                  <div>
                    <p className='text-sm text-gray-600 mb-3'>
                      <strong>과거 데이터 일괄 적재</strong> — 지정 기간의 경주 결과를 한 번에 가져옵니다
                    </p>
                    <div className='flex flex-wrap items-center gap-3'>
                      <div className='flex items-center gap-2'>
                        <label className='text-sm text-gray-500'>시작일</label>
                        <input
                          type='date'
                          value={histFrom}
                          onChange={(e) => setHistFrom(e.target.value)}
                          className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                        />
                      </div>
                      <span className='text-gray-400'>~</span>
                      <div className='flex items-center gap-2'>
                        <label className='text-sm text-gray-500'>종료일</label>
                        <input
                          type='date'
                          value={histTo}
                          onChange={(e) => setHistTo(e.target.value)}
                          className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                        />
                      </div>
                      <Button
                        variant='ghost'
                        onClick={() => syncHistoricalMutation.mutate({ from: histFrom, to: histTo })}
                        disabled={isAnyPending || !histFrom || !histTo}
                        isLoading={syncHistoricalMutation.isPending}
                      >
                        <AdminIcon icon={History} className='w-4 h-4 mr-1.5 inline' />
                        과거 데이터 적재
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </details>

          {/* 동기화 로그 */}
          <Card title='동기화 로그' description='최근 KRA API 호출 이력. 10초마다 자동 갱신됩니다.'>
            <div className='flex flex-wrap items-center gap-3 mb-4'>
              <select
                value={logEndpointFilter}
                onChange={(e) => setLogEndpointFilter(e.target.value)}
                className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none'
              >
                <option value=''>전체 엔드포인트</option>
                <option value='racePlan'>racePlan (경주계획표)</option>
                <option value='entrySheet'>entrySheet (출전표)</option>
                <option value='raceResult'>raceResult (경주결과)</option>
                <option value='jockeyResult'>jockeyResult (기수전적)</option>
                <option value='trainerInfo'>trainerInfo (조교사)</option>
                <option value='trackInfo'>trackInfo (주로정보)</option>
                <option value='raceHorseRating'>raceHorseRating (레이팅)</option>
                <option value='horseSectional'>horseSectional (구간기록)</option>
                <option value='horseWeight'>horseWeight (마체중)</option>
                <option value='equipmentBleeding'>equipmentBleeding (장구·출혈)</option>
                <option value='horseCancel'>horseCancel (출전취소)</option>
              </select>
              <span className='text-sm text-gray-500'>
                기준일: {syncDate}
              </span>
            </div>
            {logsLoading ? (
              <div className='py-8 flex justify-center'>
                <LoadingSpinner size='md' label='동기화 로그 불러오는 중...' />
              </div>
            ) : (logsData?.logs ?? []).length === 0 ? (
              <div className='py-12 text-center'>
                <AdminIcon icon={FileText} className='w-8 h-8 text-gray-300 mx-auto mb-2' />
                <p className='text-gray-500 text-sm'>해당 조건의 로그가 없습니다</p>
                <p className='text-gray-400 text-xs mt-1'>동기화를 실행하면 이곳에 기록됩니다</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200 text-sm'>
                  <thead>
                    <tr className='bg-gray-50'>
                      <th className='py-2.5 px-3 text-left font-medium text-gray-700'>시각</th>
                      <th className='py-2.5 px-3 text-left font-medium text-gray-700'>엔드포인트</th>
                      <th className='py-2.5 px-3 text-left font-medium text-gray-700'>경주장</th>
                      <th className='py-2.5 px-3 text-left font-medium text-gray-700'>날짜</th>
                      <th className='py-2.5 px-3 text-left font-medium text-gray-700'>상태</th>
                      <th className='py-2.5 px-3 text-right font-medium text-gray-700'>처리수</th>
                      <th className='py-2.5 px-3 text-right font-medium text-gray-700'>소요</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {(logsData?.logs ?? []).map((log) => (
                      <tr key={log.id} className='hover:bg-gray-50/50 transition-colors'>
                        <td className='py-2.5 px-3 text-gray-600'>
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleString('ko-KR')
                            : '-'}
                        </td>
                        <td className='py-2.5 px-3'>
                          <span className='font-mono text-xs bg-gray-100 px-2 py-0.5 rounded'>{log.endpoint}</span>
                        </td>
                        <td className='py-2.5 px-3'>{log.meet ?? '-'}</td>
                        <td className='py-2.5 px-3'>
                          {log.rcDate ? formatYyyyMmDd(log.rcDate) : '-'}
                        </td>
                        <td className='py-2.5 px-3'>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              log.status === 'SUCCESS'
                                ? 'bg-green-100 text-green-800'
                                : log.status === 'FAILED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            <AdminIcon
                              icon={log.status === 'SUCCESS' ? CheckCircle2 : log.status === 'FAILED' ? AlertTriangle : Clock}
                              className='w-3 h-3'
                            />
                            {log.status === 'SUCCESS' ? '성공' : log.status === 'FAILED' ? '실패' : log.status}
                          </span>
                        </td>
                        <td className='py-2.5 px-3 text-right font-medium'>{log.recordCount}</td>
                        <td className='py-2.5 px-3 text-right text-gray-500'>
                          {log.durationMs != null ? `${log.durationMs}ms` : '-'}
                        </td>
                      </tr>
                    ))}
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
