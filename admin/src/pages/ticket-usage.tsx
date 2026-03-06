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
        limit: 20,
        userId: userIdFilter.trim() || undefined,
        type: typeFilter || undefined,
      }),
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
  });

  const items = (data?.items ?? []) as UsageItem[];
  const totalPages = data?.totalPages ?? 1;

  const columns = [
    {
      key: 'user',
      header: '사용자',
      className: 'min-w-[160px]',
      render: (row: UsageItem) => (
        <div>
          <div className='font-medium text-gray-900'>{row.user?.name || row.user?.email || '-'}</div>
          <div className='text-xs text-gray-500'>{row.user?.email}</div>
          {row.user?.nickname && (
            <div className='text-xs text-gray-500'>@{row.user.nickname}</div>
          )}
        </div>
      ),
    },
    {
      key: 'race',
      header: '경주',
      className: 'min-w-[140px]',
      render: (row: UsageItem) => {
        const r = row.race;
        if (!r) return <span className='text-gray-400'>-</span>;
        const dateStr =
          r.rcDate?.length === 8
            ? `${r.rcDate.slice(0, 4)}-${r.rcDate.slice(4, 6)}-${r.rcDate.slice(6, 8)}`
            : r.rcDate;
        return (
          <Link
            href={`/races/${r.id}`}
            className='text-primary-600 hover:underline font-medium'
          >
            {r.meetName || r.meet} {r.rcNo}R · {dateStr}
          </Link>
        );
      },
    },
    {
      key: 'type',
      header: '유형',
      className: 'w-20',
      render: (row: UsageItem) => (
        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
          row.type === 'MATRIX'
            ? 'bg-purple-100 text-purple-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {row.type === 'MATRIX' ? '종합' : '경주'}
        </span>
      ),
    },
    {
      key: 'usedAt',
      header: '사용 일시',
      className: 'w-40',
      render: (row: UsageItem) =>
        row.usedAt ? formatDateTime(row.usedAt) : '-',
    },
    {
      key: 'prediction',
      header: '예측',
      className: 'min-w-[200px] max-w-[320px]',
      render: (row: UsageItem) => {
        const p = row.prediction;
        const analysis = p?.analysis;
        const preview = analysis
          ? analysis.length > 80
            ? `${analysis.slice(0, 80)}...`
            : analysis
          : null;
        const accuracy = p?.accuracy;
        return (
          <div className='flex flex-col gap-1'>
            <div className='flex items-center gap-2'>
              {accuracy != null && (
                <span className={`inline-flex rounded-full px-1.5 text-xs font-semibold shrink-0 ${
                  accuracy >= 60 ? 'bg-green-100 text-green-800'
                  : accuracy >= 30 ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
                }`}>
                  {accuracy}%
                </span>
              )}
              {row.raceId && (
                <Link href={`/races/${row.raceId}`}>
                  <Button size='sm' variant='ghost'>
                    보기
                  </Button>
                </Link>
              )}
            </div>
            {preview ? (
              <span className='text-xs text-gray-600 line-clamp-2' title={analysis ?? undefined}>
                {preview}
              </span>
            ) : (
              <span className='text-gray-400 text-xs'>-</span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Head>
        <title>예측권 사용 내역 | OddsCast Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader
            title='예측권 사용 내역'
            description='유저별 예측권 사용 내역과 예측 내용을 조회합니다. 사용자 ID로 필터할 수 있습니다.'
          />

          <Card>
            {usageError && (
              <div className='mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
                <p>사용 내역을 불러오는 중 오류가 발생했습니다.</p>
                <Button
                  type='button'
                  variant='secondary'
                  size='sm'
                  className='mt-2'
                  onClick={() => refetchUsage()}
                >
                  다시 시도
                </Button>
              </div>
            )}
            <div className='mb-4 flex flex-wrap gap-3 items-center'>
              <input
                type='text'
                placeholder='사용자 ID 또는 이메일 필터...'
                value={userIdFilter}
                onChange={(e) => {
                  setUserIdFilter(e.target.value);
                  setPage(1);
                }}
                className='flex-1 min-w-[200px] max-w-sm px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm'
              />
              <div className='flex gap-1'>
                {(['', 'RACE', 'MATRIX'] as const).map((t) => (
                  <button
                    key={t}
                    type='button'
                    onClick={() => { setTypeFilter(t); setPage(1); }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                      typeFilter === t
                        ? t === 'MATRIX'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : t === 'RACE'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {t === '' ? '전체' : t === 'RACE' ? '경주' : '종합'}
                  </button>
                ))}
              </div>
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
              />
            )}
          </Card>
        </div>
      </Layout>
    </>
  );
}
