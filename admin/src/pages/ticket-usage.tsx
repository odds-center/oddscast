import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import Table from '@/components/common/Table';
import Pagination from '@/components/common/Pagination';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { adminPredictionTicketsApi } from '@/lib/api/admin';
import { formatDateTime } from '@/lib/utils';

const LIMIT = 20;

type UsageItem = {
  id: number;
  userId: number;
  user: { id: number; email: string; name: string; nickname?: string };
  raceId: number | null;
  race: {
    id: number;
    rcNo: string;
    meet: string;
    meetName?: string;
    rcDate: string;
    rcName?: string;
  } | null;
  predictionId: number | null;
  prediction: {
    id: number;
    analysis: string | null;
    status: string;
    accuracy?: number;
    scores?: unknown;
  } | null;
  type: string;
  usedAt: Date | string | null;
  matrixDate: string | null;
};

export default function TicketUsagePage() {
  const [page, setPage] = useState(1);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | 'RACE' | 'MATRIX'>('');

  const { data, isLoading, error: usageError, refetch: refetchUsage } = useQuery({
    queryKey: ['admin', 'prediction-tickets', 'usage', page, userIdFilter, typeFilter],
    queryFn: () =>
      adminPredictionTicketsApi.getUsage({
        page,
        limit: LIMIT,
        userId: userIdFilter.trim() || undefined,
        type: typeFilter || undefined,
      }),
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
  });

  const items = (data?.items ?? []) as UsageItem[];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const columns = [
    {
      key: 'user',
      header: '사용자',
      className: 'min-w-[120px]',
      render: (row: UsageItem) => (
        <div className='leading-tight'>
          <div className='font-medium text-gray-900 truncate max-w-[140px]'>
            {row.user?.name || row.user?.email || '-'}
          </div>
          <div className='text-[11px] text-gray-400 truncate max-w-[140px]'>{row.user?.email}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: '유형',
      className: 'w-14',
      render: (row: UsageItem) => (
        <span className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-semibold ${
          row.type === 'MATRIX'
            ? 'bg-purple-50 text-purple-700'
            : 'bg-blue-50 text-blue-700'
        }`}>
          {row.type === 'MATRIX' ? '종합' : '경주'}
        </span>
      ),
    },
    {
      key: 'race',
      header: '경주',
      className: 'min-w-[100px]',
      render: (row: UsageItem) => {
        const r = row.race;
        if (!r) return <span className='text-gray-300'>-</span>;
        const dateStr =
          r.rcDate?.length === 8
            ? `${r.rcDate.slice(4, 6)}/${r.rcDate.slice(6, 8)}`
            : r.rcDate;
        return (
          <Link
            href={`/races/${r.id}`}
            className='text-primary-600 hover:underline'
          >
            {r.meetName || r.meet} {r.rcNo}R · {dateStr}
          </Link>
        );
      },
    },
    {
      key: 'accuracy',
      header: '적중',
      className: 'w-12 text-center',
      render: (row: UsageItem) => {
        const accuracy = row.prediction?.accuracy;
        if (accuracy == null) return <span className='text-gray-300'>-</span>;
        return (
          <span className={`inline-flex rounded px-1 py-0.5 text-[11px] font-semibold ${
            accuracy >= 60 ? 'bg-green-50 text-green-700'
            : accuracy >= 30 ? 'bg-yellow-50 text-yellow-700'
            : 'bg-red-50 text-red-700'
          }`}>
            {accuracy}%
          </span>
        );
      },
    },
    {
      key: 'usedAt',
      header: '사용일시',
      className: 'w-32',
      render: (row: UsageItem) =>
        row.usedAt ? (
          <span className='text-gray-600'>{formatDateTime(row.usedAt)}</span>
        ) : (
          <span className='text-gray-300'>-</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-10',
      render: (row: UsageItem) =>
        row.raceId ? (
          <Link href={`/races/${row.raceId}`}>
            <Button size='sm' variant='ghost' className='!px-1.5 !py-0.5 text-[11px]'>
              보기
            </Button>
          </Link>
        ) : null,
    },
  ];

  return (
    <>
      <Head>
        <title>예측권 사용 내역 | OddsCast Admin</title>
      </Head>
      <Layout>
        <div className='space-y-3'>
          <PageHeader
            title='예측권 사용 내역'
            description='유저별 예측권 사용 내역을 조회합니다.'
          />

          <Card>
            {usageError && (
              <div className='mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800'>
                <p>사용 내역을 불러오는 중 오류가 발생했습니다.</p>
                <Button
                  type='button'
                  variant='secondary'
                  size='sm'
                  className='mt-1'
                  onClick={() => refetchUsage()}
                >
                  다시 시도
                </Button>
              </div>
            )}
            <div className='mb-3 flex flex-wrap gap-2 items-center'>
              <input
                type='text'
                placeholder='사용자 ID / 이메일 필터...'
                value={userIdFilter}
                onChange={(e) => {
                  setUserIdFilter(e.target.value);
                  setPage(1);
                }}
                className='flex-1 min-w-[180px] max-w-xs px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary-500'
              />
              <div className='flex gap-0.5'>
                {(['', 'RACE', 'MATRIX'] as const).map((t) => (
                  <button
                    key={t}
                    type='button'
                    onClick={() => { setTypeFilter(t); setPage(1); }}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
                      typeFilter === t
                        ? t === 'MATRIX'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : t === 'RACE'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {t === '' ? '전체' : t === 'RACE' ? '경주' : '종합'}
                  </button>
                ))}
              </div>
              {total > 0 && (
                <span className='text-[11px] text-gray-400 ml-auto'>총 {total}건</span>
              )}
            </div>

            <Table
              data={items}
              columns={columns}
              isLoading={isLoading}
              getRowKey={(row: UsageItem) => String(row.id)}
              emptyMessage='사용 내역이 없습니다.'
            />

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                total={total}
                limit={LIMIT}
              />
            )}
          </Card>
        </div>
      </Layout>
    </>
  );
}
