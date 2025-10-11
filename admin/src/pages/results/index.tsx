import { useState } from 'react';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import Table from '@/components/common/Table';
import Pagination from '@/components/common/Pagination';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface RaceResult {
  resultId: string;
  raceId: string;
  rcDate: string;
  rcNo: string;
  rcName: string;
  meet: string;
  meetName: string;
  rcDist: string;
  rcRank: string;
  hrName: string;
  hrNo: string;
  jkName: string;
  trName: string;
  rcTime: string;
  rcPrize?: number;
  ord: string;
  createdAt: string;
}

export default function ResultsPage() {
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const [selectedResult, setSelectedResult] = useState<RaceResult | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-results', page, dateFilter],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (dateFilter) params.date = dateFilter;
      const response = await apiClient.get<any>('/api/admin/results', { params });
      return response;
    },
  });

  const columns = [
    {
      key: 'rcDate',
      header: '날짜',
      render: (result: RaceResult) => {
        const dateStr = result.rcDate;
        if (dateStr && dateStr.length === 8) {
          return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        }
        return dateStr;
      },
    },
    {
      key: 'meetName',
      header: '경주장',
    },
    {
      key: 'rcNo',
      header: '경주',
      className: 'w-20',
      render: (result: RaceResult) => `${result.rcNo}R`,
    },
    {
      key: 'rcName',
      header: '경주명',
    },
    {
      key: 'rcDist',
      header: '거리',
      render: (result: RaceResult) => `${result.rcDist}m`,
    },
    {
      key: 'rank',
      header: '순위',
      className: 'w-16',
      render: (result: RaceResult) => {
        const rank = parseInt(result.rcRank);
        const colors: any = {
          1: 'bg-yellow-500',
          2: 'bg-gray-400',
          3: 'bg-orange-600',
        };
        return (
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
              colors[rank] || 'bg-gray-300'
            } text-white font-bold`}
          >
            {rank}
          </span>
        );
      },
    },
    {
      key: 'horse',
      header: '말',
      render: (result: RaceResult) => (
        <div>
          <div className='font-semibold'>{result.hrName}</div>
          <div className='text-sm text-gray-500'>#{result.hrNo}</div>
        </div>
      ),
    },
    {
      key: 'jockey',
      header: '기수',
      render: (result: RaceResult) => result.jkName,
    },
    {
      key: 'time',
      header: '기록',
      render: (result: RaceResult) => result.rcTime || '-',
    },
    {
      key: 'actions',
      header: '작업',
      render: (result: RaceResult) => (
        <div className='flex gap-2'>
          <Button size='sm' variant='ghost' onClick={() => setSelectedResult(result)}>
            상세
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>경기 결과 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>경기 결과</h1>
              <p className='mt-2 text-sm text-gray-600'>경주 결과를 조회하고 관리할 수 있습니다.</p>
            </div>
          </div>

          <Card>
            <div className='mb-4 flex gap-4'>
              <input
                type='date'
                value={dateFilter}
                onChange={(e) => {
                  const date = e.target.value.replace(/-/g, '');
                  setDateFilter(date);
                }}
                className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
              />
              {dateFilter && (
                <Button variant='ghost' onClick={() => setDateFilter('')}>
                  필터 초기화
                </Button>
              )}
            </div>

            <Table
              data={data?.data || []}
              columns={columns}
              isLoading={isLoading}
              emptyMessage='경기 결과가 없습니다.'
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

        {/* 결과 상세 모달 */}
        {selectedResult && (
          <div
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
            onClick={() => setSelectedResult(null)}
          >
            <div
              className='bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex justify-between items-start mb-6'>
                <h2 className='text-2xl font-bold'>경기 결과 상세</h2>
                <button
                  onClick={() => setSelectedResult(null)}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>

              <div className='space-y-6'>
                {/* 경주 정보 */}
                <div className='border-b pb-4'>
                  <h3 className='font-semibold text-lg mb-3'>경주 정보</h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>날짜</label>
                      <div className='text-gray-900'>
                        {selectedResult.rcDate?.length === 8
                          ? `${selectedResult.rcDate.slice(0, 4)}-${selectedResult.rcDate.slice(
                              4,
                              6
                            )}-${selectedResult.rcDate.slice(6, 8)}`
                          : selectedResult.rcDate}
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>경주장</label>
                      <div className='text-gray-900'>{selectedResult.meet}</div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        경주번호
                      </label>
                      <div className='text-gray-900'>{selectedResult.rcNo}R</div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>경주명</label>
                      <div className='text-gray-900'>{selectedResult.rcName}</div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>거리</label>
                      <div className='text-gray-900'>{selectedResult.rcDist}m</div>
                    </div>
                  </div>
                </div>

                {/* 경주마 정보 */}
                <div className='border-b pb-4'>
                  <h3 className='font-semibold text-lg mb-3'>경주마 정보</h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>순위</label>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${
                            parseInt(selectedResult.rcRank) === 1
                              ? 'bg-yellow-500'
                              : parseInt(selectedResult.rcRank) === 2
                              ? 'bg-gray-400'
                              : parseInt(selectedResult.rcRank) === 3
                              ? 'bg-orange-600'
                              : 'bg-gray-300'
                          } text-white font-bold text-lg`}
                        >
                          {selectedResult.rcRank}
                        </span>
                        <span className='text-2xl font-bold'>{selectedResult.rcRank}착</span>
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>기록</label>
                      <div className='text-2xl font-bold text-blue-600'>
                        {selectedResult.rcTime}
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>마명</label>
                      <div className='text-gray-900 font-semibold'>{selectedResult.hrName}</div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>마번</label>
                      <div className='text-gray-900'>{selectedResult.hrNo}번</div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>기수</label>
                      <div className='text-gray-900'>{selectedResult.jkName}</div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>조교사</label>
                      <div className='text-gray-900'>{selectedResult.trName}</div>
                    </div>
                  </div>
                </div>

                {/* 상금 */}
                {selectedResult.rcPrize && (
                  <div>
                    <h3 className='font-semibold text-lg mb-3'>상금</h3>
                    <div className='bg-green-50 p-4 rounded-lg'>
                      <div className='text-sm text-gray-600 mb-1'>착순 상금</div>
                      <div className='text-3xl font-bold text-green-600'>
                        {selectedResult.rcPrize.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                )}

                <div className='border-t pt-4 flex gap-2'>
                  <Button
                    variant='ghost'
                    className='flex-1'
                    onClick={() => setSelectedResult(null)}
                  >
                    닫기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
