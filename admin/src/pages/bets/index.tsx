import { useState } from 'react';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import Table from '@/components/common/Table';
import Pagination from '@/components/common/Pagination';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { apiClient } from '@/lib/api';
import { formatDateTime, formatCurrency } from '@/lib/utils';

interface Bet {
  id: string;
  userId: string;
  raceId: string;
  betType: string;
  betAmount: number;
  odds: number;
  potentialWin: number;
  betStatus: string;
  betResult: string;
  actualWin?: number;
  createdAt: string;
}

export default function BetsPage() {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bets', page, userId],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (userId) params.userId = userId;
      const response = await apiClient.get<any>('/api/admin/bets', { params });
      return response;
    },
  });

  const columns = [
    {
      key: 'id',
      header: 'ID',
      className: 'w-24',
      render: (bet: Bet) => bet.id.slice(0, 8),
    },
    {
      key: 'userId',
      header: '사용자',
      render: (bet: Bet) => bet.userId.slice(0, 8),
    },
    {
      key: 'raceId',
      header: '경주',
      render: (bet: Bet) => bet.raceId.slice(0, 8),
    },
    {
      key: 'betType',
      header: '베팅 타입',
    },
    {
      key: 'betAmount',
      header: '베팅 금액',
      render: (bet: Bet) => formatCurrency(bet.betAmount),
    },
    {
      key: 'odds',
      header: '배당률',
      render: (bet: Bet) => `${bet.odds.toFixed(2)}`,
    },
    {
      key: 'potentialWin',
      header: '예상 당첨금',
      render: (bet: Bet) => formatCurrency(bet.potentialWin),
    },
    {
      key: 'betStatus',
      header: '상태',
      render: (bet: Bet) => {
        const statusColors = {
          PENDING: 'bg-yellow-100 text-yellow-800',
          CONFIRMED: 'bg-blue-100 text-blue-800',
          CANCELLED: 'bg-red-100 text-red-800',
        };
        const statusLabels = {
          PENDING: '대기',
          CONFIRMED: '확정',
          CANCELLED: '취소',
        };
        return (
          <span
            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
              statusColors[bet.betStatus as keyof typeof statusColors] ||
              'bg-gray-100 text-gray-800'
            }`}
          >
            {statusLabels[bet.betStatus as keyof typeof statusLabels] || bet.betStatus}
          </span>
        );
      },
    },
    {
      key: 'betResult',
      header: '결과',
      render: (bet: Bet) => {
        const resultColors = {
          PENDING: 'bg-gray-100 text-gray-800',
          WIN: 'bg-green-100 text-green-800',
          LOSE: 'bg-red-100 text-red-800',
          REFUND: 'bg-blue-100 text-blue-800',
        };
        const resultLabels = {
          PENDING: '대기',
          WIN: '당첨',
          LOSE: '낙첨',
          REFUND: '환불',
        };
        return (
          <span
            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
              resultColors[bet.betResult as keyof typeof resultColors] ||
              'bg-gray-100 text-gray-800'
            }`}
          >
            {resultLabels[bet.betResult as keyof typeof resultLabels] || bet.betResult}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: '생성일',
      render: (bet: Bet) => formatDateTime(bet.createdAt),
    },
  ];

  return (
    <>
      <Head>
        <title>베팅 관리 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>베팅 관리</h1>
              <p className='mt-2 text-sm text-gray-600'>
                모든 베팅 내역을 조회하고 관리할 수 있습니다.
              </p>
            </div>
          </div>

          <Card>
            <div className='mb-4'>
              <input
                type='text'
                placeholder='사용자 ID로 검색...'
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className='w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
              />
            </div>

            <Table
              data={data?.data || []}
              columns={columns}
              isLoading={isLoading}
              emptyMessage='베팅 내역이 없습니다.'
            />

            {data && data.meta && (
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
