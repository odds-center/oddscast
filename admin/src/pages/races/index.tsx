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

interface RaceData {
  id: string;
  rcNo: string;
  rcName: string;
  rcDate: string;
  rcTime?: string;
  meet: string;
  rcDist: string;
  rcGrade?: string;
  status?: string;
}

export default function RacesPage() {
  const [page, setPage] = useState(1);
  const [selectedRace, setSelectedRace] = useState<RaceData | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-races', page],
    queryFn: async () => {
      const response = await apiClient.get<any>('/api/admin/races', {
        params: { page, limit: 20 },
      });
      return response;
    },
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
        const statusColors = {
          scheduled: 'bg-blue-100 text-blue-800',
          ongoing: 'bg-yellow-100 text-yellow-800',
          completed: 'bg-green-100 text-green-800',
          cancelled: 'bg-red-100 text-red-800',
        };
        const statusLabels = {
          scheduled: '예정',
          ongoing: '진행중',
          completed: '완료',
          cancelled: '취소',
        };
        return (
          <span
            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
              statusColors[race.status as keyof typeof statusColors]
            }`}
          >
            {statusLabels[race.status as keyof typeof statusLabels]}
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
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>경주 관리</h1>
              <p className='mt-2 text-sm text-gray-600'>경주 일정과 정보를 관리할 수 있습니다.</p>
            </div>
            <Button>경주 추가</Button>
          </div>

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
          <div
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
            onClick={() => setSelectedRace(null)}
          >
            <div
              className='bg-white rounded-lg p-6 max-w-2xl w-full mx-4'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex justify-between items-start mb-6'>
                <h2 className='text-2xl font-bold'>경주 상세 정보</h2>
                <button
                  onClick={() => setSelectedRace(null)}
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
                  {selectedRace.rcGrade && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>등급</label>
                      <div className='text-gray-900'>{selectedRace.rcGrade}</div>
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
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
