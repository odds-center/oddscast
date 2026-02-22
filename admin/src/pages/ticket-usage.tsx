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

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'prediction-tickets', 'usage', page, userIdFilter],
    queryFn: () =>
      adminPredictionTicketsApi.getUsage({
        page,
        limit: 20,
        userId: userIdFilter.trim() || undefined,
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
        <span className='text-sm'>{row.type === 'MATRIX' ? '종합' : '경주'}</span>
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
      header: '예측 내용',
      className: 'min-w-[200px] max-w-[320px]',
      render: (row: UsageItem) => {
        const p = row.prediction;
        const analysis = p?.analysis;
        const preview = analysis
          ? analysis.length > 120
            ? `${analysis.slice(0, 120)}...`
            : analysis
          : null;
        return (
          <div className='flex items-center gap-2'>
            {preview ? (
              <span className='text-sm text-gray-700 line-clamp-2' title={analysis ?? undefined}>
                {preview}
              </span>
            ) : (
              <span className='text-gray-400 text-sm'>-</span>
            )}
            {row.raceId && (
              <Link href={`/races/${row.raceId}`}>
                <Button size='sm' variant='ghost'>
                  보기
                </Button>
              </Link>
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
            <div className='mb-4'>
              <input
                type='text'
                placeholder='사용자 ID로 필터...'
                value={userIdFilter}
                onChange={(e) => {
                  setUserIdFilter(e.target.value);
                  setPage(1);
                }}
                className='w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
              />
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
