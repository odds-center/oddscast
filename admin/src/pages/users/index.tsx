import { useState } from 'react';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import Table from '@/components/common/Table';
import Pagination from '@/components/common/Pagination';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import PageHeader from '@/components/common/PageHeader';
import { adminUsersApi } from '@/lib/api/admin';
import { formatDateTime } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  totalBets?: number;
  wonBets?: number;
  totalBetAmount?: number;
  totalWinAmount?: number;
  createdAt: string;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminUsersApi.getAll({ page, limit: 20, search }),
    placeholderData: (previousData) => previousData, // 이전 데이터 유지 (깜빡임 방지)
    staleTime: 2 * 60 * 1000, // 2분
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => {
      return isActive ? adminUsersApi.deactivate(id) : adminUsersApi.activate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const columns = [
    {
      key: 'id',
      header: 'ID',
      className: 'w-24',
      render: (user: User) => user.id.slice(0, 8),
    },
    {
      key: 'email',
      header: '이메일',
    },
    {
      key: 'name',
      header: '이름',
    },
    {
      key: 'role',
      header: '역할',
      render: (user: User) => (
        <span className='inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800'>
          {user.role}
        </span>
      ),
    },
    {
      key: 'stats',
      header: '베팅 통계',
      render: (user: User) => (
        <div className='text-sm'>
          <div>{(user.totalBets ?? 0)}건</div>
          <div className='text-gray-500'>
            승률:{' '}
            {(user.totalBets ?? 0) > 0
              ? (((user.wonBets ?? 0) / (user.totalBets ?? 1)) * 100).toFixed(1)
              : 0}
            %
          </div>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: '상태',
      render: (user: User) => (
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {user.isActive ? '활성' : '비활성'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: '가입일',
      render: (user: User) => formatDateTime(user.createdAt),
    },
    {
      key: 'actions',
      header: '작업',
      render: (user: User) => (
        <div className='flex gap-2'>
          <Button size='sm' variant='ghost' onClick={() => setSelectedUser(user)}>
            상세
          </Button>
          <Button
            size='sm'
            variant={user.isActive ? 'danger' : 'secondary'}
            onClick={() => toggleActiveMutation.mutate({ id: user.id, isActive: user.isActive })}
            disabled={toggleActiveMutation.isPending}
          >
            {user.isActive ? '비활성화' : '활성화'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>회원 관리 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader
            title='회원 관리'
            description='가입한 회원들을 관리할 수 있습니다.'
          />

          <Card>
            <div className='mb-3'>
              <input
                type='text'
                placeholder='이메일 또는 사용자명으로 검색...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full max-w-md px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500'
              />
            </div>

            <Table
              data={data?.data || []}
              columns={columns}
              isLoading={isLoading}
              emptyMessage='회원이 없습니다.'
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

        {/* 사용자 상세 모달 */}
        {selectedUser && (
        <Modal
          open
          onClose={() => setSelectedUser(null)}
          title='회원 상세 정보'
        >
          <div className='space-y-3'>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>ID</label>
                    <div className='text-gray-900'>{selectedUser.id}</div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>이메일</label>
                    <div className='text-gray-900'>{selectedUser.email}</div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>이름</label>
                    <div className='text-gray-900'>{selectedUser.name}</div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>역할</label>
                    <div>
                      <span className='inline-flex rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800'>
                        {selectedUser.role}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>상태</label>
                    <div>
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${
                          selectedUser.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {selectedUser.isActive ? '활성' : '비활성'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>가입일</label>
                    <div className='text-gray-900'>{formatDateTime(selectedUser.createdAt)}</div>
                  </div>
                </div>

                <div className='border-t pt-3'>
                  <h3 className='text-sm font-semibold mb-2'>베팅 통계</h3>
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='bg-gray-50 p-2.5 rounded'>
                      <div className='text-xs text-gray-600'>총 베팅 수</div>
                      <div className='text-base font-bold'>{selectedUser.totalBets ?? 0}건</div>
                    </div>
                    <div className='bg-gray-50 p-2.5 rounded'>
                      <div className='text-xs text-gray-600'>승리 횟수</div>
                      <div className='text-base font-bold text-green-600'>
                        {selectedUser.wonBets ?? 0}건
                      </div>
                    </div>
                    <div className='bg-gray-50 p-2.5 rounded'>
                      <div className='text-xs text-gray-600'>총 베팅 금액</div>
                      <div className='text-base font-bold'>
                        {(selectedUser.totalBetAmount ?? 0).toLocaleString()}원
                      </div>
                    </div>
                    <div className='bg-gray-50 p-2.5 rounded'>
                      <div className='text-xs text-gray-600'>총 당첨 금액</div>
                      <div className='text-base font-bold text-green-600'>
                        {(selectedUser.totalWinAmount ?? 0).toLocaleString()}원
                      </div>
                    </div>
                  </div>
                  <div className='mt-2 bg-blue-50 p-2.5 rounded'>
                    <div className='text-xs text-gray-600'>승률</div>
                    <div className='text-base font-bold text-blue-600'>
                      {(selectedUser.totalBets ?? 0) > 0
                        ? (
                            ((selectedUser.wonBets ?? 0) / (selectedUser.totalBets ?? 1)) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </div>
                  </div>
                </div>

                <div className='border-t pt-3 flex gap-2'>
                  <Button
                    variant={selectedUser.isActive ? 'danger' : 'secondary'}
                    className='flex-1'
                    onClick={() => {
                      toggleActiveMutation.mutate({
                        id: selectedUser.id,
                        isActive: selectedUser.isActive,
                      });
                      setSelectedUser(null);
                    }}
                  >
                    {selectedUser.isActive ? '비활성화' : '활성화'}
                  </Button>
                  <Button variant='ghost' className='flex-1' onClick={() => setSelectedUser(null)}>
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
