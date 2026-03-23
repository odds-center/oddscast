import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import Table from '@/components/common/Table';
import Pagination from '@/components/common/Pagination';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { AdminAIApi, adminAIConfigApi } from '@/lib/api/admin';
import { formatDateTime, formatYyyyMmDd } from '@/lib/utils';

type PredictionRow = {
  id: number;
  raceId: number;
  status: string;
  previewApproved?: boolean;
  accuracy: number | null;
  createdAt: string;
  race: {
    id: number;
    rcDate: string;
    rcNo: string;
    meet: string;
    meetName: string | null;
    rcName: string | null;
    status: string;
  };
};

export default function PredictionsListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [batchDateFrom, setBatchDateFrom] = useState('');
  const [batchDateTo, setBatchDateTo] = useState('');
  const [forDateDate, setForDateDate] = useState('');
  const [forDateMeet, setForDateMeet] = useState('');
  const [batchProgress, setBatchProgress] = useState<{
    requested: number;
    current: number;
    generated: number;
    failed: number;
    lastRace?: string;
    retryAfter?: number;
  } | null>(null);

  const { data, isLoading, error: listError, refetch: refetchList } = useQuery({
    queryKey: ['admin', 'predictions', 'list', page, statusFilter],
    queryFn: () =>
      AdminAIApi.getPredictionsList({
        page,
        limit: 50,
        status: statusFilter || undefined,
      }),
    placeholderData: (prev) => prev,
    staleTime: 60 * 1000,
  });

  const { data: todayStats } = useQuery({
    queryKey: ['admin', 'predictions', 'today'],
    queryFn: () => AdminAIApi.getPredictionsTodayCount(),
    staleTime: 60 * 1000,
  });

  const { data: aiConfig } = useQuery({
    queryKey: ['ai-config'],
    queryFn: () => adminAIConfigApi.getConfig(),
    staleTime: 60 * 1000,
  });

  const predictions = (data?.predictions ?? []) as PredictionRow[];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const generateBatchMutation = useMutation({
    mutationFn: async (params: { dateFrom?: string; dateTo?: string }) => {
      setBatchProgress({ requested: 0, current: 0, generated: 0, failed: 0 });
      return AdminAIApi.generateBatchStream(params, (event) => {
        if (event.done) {
          setBatchProgress(null);
          return;
        }
        setBatchProgress({
          requested: event.requested ?? 0,
          current: event.current ?? 0,
          generated: event.generated ?? 0,
          failed: event.failed ?? 0,
          lastRace: event.lastRace,
          retryAfter: event.retryAfter,
        });
      });
    },
    onSuccess: (result) => {
      const { requested, generated, failed, errors } = result;
      toast.success(
        `일괄 생성 완료: ${requested}건 중 ${generated}건 성공${failed > 0 ? `, ${failed}건 실패` : ''}`,
      );
      if (errors.length > 0 && errors.length <= 5) {
        errors.forEach((e) => toast.error(e));
      } else if (errors.length > 5) {
        toast.error(`실패 ${failed}건 (처음 5건): ${errors.slice(0, 5).join('; ')}...`);
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'predictions'] });
    },
    onError: (err: Error) => {
      setBatchProgress(null);
      toast.error(err.message || '일괄 생성 실패');
    },
  });

  const handleBatchGenerate = () => {
    const from = batchDateFrom.replace(/-/g, '').slice(0, 8) || undefined;
    const to = batchDateTo.replace(/-/g, '').slice(0, 8) || undefined;
    generateBatchMutation.mutate({ dateFrom: from, dateTo: to });
  };

  const generateForDateMutation = useMutation({
    mutationFn: (params: { date: string; meet?: string }) =>
      AdminAIApi.generateForDate(params),
    onSuccess: (result) => {
      const { requested, generated, failed, errors } = result;
      toast.success(
        `날짜별 생성 완료: ${requested}건 중 ${generated}건 성공${failed > 0 ? `, ${failed}건 실패` : ''}`,
      );
      if (errors.length > 0) {
        errors.slice(0, 3).forEach((e) => toast.error(e));
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'predictions'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || '날짜별 생성 실패');
    },
  });

  const handleForDateGenerate = () => {
    const date = forDateDate.replace(/-/g, '').slice(0, 8);
    if (!date) {
      toast.error('날짜를 선택해 주세요');
      return;
    }
    generateForDateMutation.mutate({ date, meet: forDateMeet || undefined });
  };

  const columns = [
    {
      key: 'race',
      header: '경주',
      className: 'min-w-[180px]',
      render: (row: PredictionRow) => {
        const r = row.race;
        if (!r) return '-';
        return (
          <Link
            href={`/races/${r.id}`}
            className='text-primary-600 hover:underline font-medium'
          >
            {r.meetName || r.meet} {r.rcNo}R · {formatYyyyMmDd(r.rcDate)}
          </Link>
        );
      },
    },
    {
      key: 'id',
      header: '예측 ID',
      className: 'w-20',
      render: (row: PredictionRow) => row.id,
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-24',
      render: (row: PredictionRow) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
            row.status === 'COMPLETED'
              ? 'bg-green-100 text-green-800'
              : row.status === 'FAILED'
                ? 'bg-red-100 text-red-800'
                : row.status === 'PROCESSING'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'previewApproved',
      header: '공개',
      className: 'w-16',
      render: (row: PredictionRow) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
            row.previewApproved
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {row.previewApproved ? 'ON' : 'OFF'}
        </span>
      ),
    },
    {
      key: 'accuracy',
      header: '적중률',
      className: 'w-20',
      render: (row: PredictionRow) => {
        const r = row.race;
        const text = row.accuracy != null ? `${row.accuracy}%` : '-';
        if (r?.id) {
          return (
            <Link
              href={`/races/${r.id}`}
              className='text-primary-600 hover:underline font-medium'
            >
              {text}
            </Link>
          );
        }
        return text;
      },
    },
    {
      key: 'createdAt',
      header: '생성 일시',
      className: 'min-w-[140px]',
      render: (row: PredictionRow) => formatDateTime(row.createdAt),
    },
  ];

  return (
    <>
      <Head>
        <title>예측 목록 | OddsCast Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader
            title='예측 목록'
            description='전체 AI 예측을 순서대로 조회합니다. 경주별 결과와 연계해 확인할 수 있으며, 미생성 예측을 기간·경주 순으로 일괄 생성할 수 있습니다.'
          />

          <div className='flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm'>
            <span className='font-medium text-gray-700'>배치 예측:</span>
            <span className={aiConfig?.enableBatchPrediction ? 'text-green-700' : 'text-amber-700'}>
              {aiConfig?.enableBatchPrediction ? 'ON' : 'OFF'}
            </span>
            {aiConfig?.batchCronSchedule != null && (
              <span className='text-gray-600'>스케줄: {String(aiConfig.batchCronSchedule)}</span>
            )}
            <Link href='/ai-config' className='text-primary-600 hover:underline'>
              AI 설정에서 변경
            </Link>
            <span className='text-gray-400'>|</span>
            <span className='font-medium text-gray-700'>오늘 생성:</span>
            <span className='text-gray-800'>{todayStats?.count ?? '-'}건</span>
          </div>

          <Card
            title='미생성 예측 일괄 생성'
            description='기간 내 예측이 없는 경주를 rcDate·경주 번호 순으로 순차 생성합니다. 기본 기간: 최근 30일 ~ 오늘+7일(미래 경주 포함). 경주 간 지연·429 재시도 적용.'
          >
            <div className='flex flex-wrap items-end gap-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>시작일</label>
                <input
                  type='date'
                  value={batchDateFrom}
                  onChange={(e) => setBatchDateFrom(e.target.value)}
                  className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>종료일</label>
                <input
                  type='date'
                  value={batchDateTo}
                  onChange={(e) => setBatchDateTo(e.target.value)}
                  className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm'
                />
              </div>
              <Button
                onClick={handleBatchGenerate}
                disabled={generateBatchMutation.isPending}
              >
                {generateBatchMutation.isPending ? '생성 중...' : '일괄 생성 실행'}
              </Button>
            </div>
            {batchProgress && batchProgress.requested > 0 && (
              <div className='mt-4 space-y-2'>
                <div className='flex justify-between text-sm text-gray-600'>
                  <span>
                    진행: {batchProgress.current} / {batchProgress.requested}
                    {batchProgress.lastRace ? ` · ${batchProgress.lastRace}` : ''}
                    {batchProgress.retryAfter != null
                      ? ` · 429 대기 ${batchProgress.retryAfter}초 후 재시도`
                      : ''}
                  </span>
                  <span>
                    성공 {batchProgress.generated} · 실패 {batchProgress.failed}
                  </span>
                </div>
                <div className='h-3 w-full rounded-full bg-gray-200 overflow-hidden'>
                  <div
                    className='h-full rounded-full bg-primary-600 transition-all duration-300'
                    style={{
                      width: `${
                        batchProgress.requested
                          ? Math.min(100, (batchProgress.current / batchProgress.requested) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}
          </Card>

          <Card
            title='날짜별 전체 경주 예측 생성 (종합 배치)'
            description='특정 날짜의 모든 경주를 한번에 예측 생성합니다. 기존 예측을 덮어씁니다. Gemini 할당량 소모에 주의.'
          >
            <div className='flex flex-wrap items-end gap-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>날짜</label>
                <input
                  type='date'
                  value={forDateDate}
                  onChange={(e) => setForDateDate(e.target.value)}
                  className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>경마장 (선택)</label>
                <select
                  value={forDateMeet}
                  onChange={(e) => setForDateMeet(e.target.value)}
                  className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm'
                >
                  <option value=''>전체</option>
                  <option value='서울'>서울</option>
                  <option value='제주'>제주</option>
                  <option value='부산경남'>부산경남</option>
                </select>
              </div>
              <Button
                onClick={handleForDateGenerate}
                disabled={generateForDateMutation.isPending}
              >
                {generateForDateMutation.isPending ? '생성 중...' : '날짜별 전체 생성'}
              </Button>
            </div>
          </Card>

          <Card>
            {listError && (
              <div className='mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
                <p>예측 목록을 불러오는 중 오류가 발생했습니다.</p>
                <Button
                  type='button'
                  variant='secondary'
                  size='sm'
                  className='mt-2'
                  onClick={() => refetchList()}
                >
                  다시 시도
                </Button>
              </div>
            )}
            <div className='mb-4 flex flex-wrap items-center gap-4'>
              <div className='flex items-center gap-2'>
                <label className='text-sm font-medium text-gray-700'>상태 필터</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm'
                >
                  <option value=''>전체</option>
                  <option value='COMPLETED'>완료 (COMPLETED)</option>
                  <option value='PENDING'>대기 (PENDING)</option>
                  <option value='PROCESSING'>처리 중 (PROCESSING)</option>
                  <option value='FAILED'>실패 (FAILED)</option>
                </select>
              </div>
              <span className='text-sm text-gray-500'>총 {total}건</span>
            </div>

            <Table
              data={predictions}
              columns={columns}
              isLoading={isLoading}
              getRowKey={(row: PredictionRow) => String(row.id)}
              emptyMessage='예측이 없습니다.'
            />

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                total={total}
                limit={50}
              />
            )}
          </Card>
        </div>
      </Layout>
    </>
  );
}
