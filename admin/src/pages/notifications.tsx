import { useState } from 'react';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import Pagination from '@/components/common/Pagination';
import { apiClient } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [isSending, setIsSending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications', page],
    queryFn: async () => {
      const response = await apiClient.get<any>('/api/admin/notifications', {
        params: { page, limit: 20 },
      });
      return response;
    },
  });

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setIsSending(true);
    try {
      await apiClient.post('/api/admin/notifications/send', {
        title,
        message,
        target,
      });

      alert('알림이 전송되었습니다!');
      setTitle('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    } catch (error) {
      alert('알림 전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const columns = [
    {
      key: 'userId',
      header: '사용자 ID',
      className: 'w-32',
      render: (notification: Notification) => notification.userId?.slice(0, 8) || '-',
    },
    {
      key: 'title',
      header: '제목',
    },
    {
      key: 'message',
      header: '내용',
      render: (notification: Notification) => (
        <div className='max-w-md truncate'>{notification.message}</div>
      ),
    },
    {
      key: 'type',
      header: '유형',
      render: (notification: Notification) => (
        <span className='inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800'>
          {notification.type}
        </span>
      ),
    },
    {
      key: 'isRead',
      header: '읽음',
      render: (notification: Notification) => (
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
            notification.isRead ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {notification.isRead ? '읽음' : '안읽음'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: '전송일',
      render: (notification: Notification) => formatDateTime(notification.createdAt),
    },
  ];

  return (
    <>
      <Head>
        <title>알림 관리 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>알림 관리</h1>
            <p className='mt-2 text-sm text-gray-600'>
              사용자에게 푸시 알림을 전송하고 내역을 조회할 수 있습니다.
            </p>
          </div>

          <Card title='알림 전송' description='모바일 앱 사용자들에게 푸시 알림을 전송합니다.'>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>제목</label>
                <input
                  type='text'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
                  placeholder='알림 제목을 입력하세요'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>내용</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
                  placeholder='알림 내용을 입력하세요'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>전송 대상</label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
                >
                  <option value='all'>전체 회원</option>
                  <option value='active'>활성 회원</option>
                  <option value='subscribers'>구독자</option>
                </select>
              </div>
              <Button
                className='w-full'
                onClick={handleSendNotification}
                isLoading={isSending}
                disabled={isSending || !title.trim() || !message.trim()}
              >
                <Bell className='w-4 h-4 mr-2' />
                알림 전송
              </Button>
            </div>
          </Card>

          <Card title='알림 내역' description='전송된 알림 목록을 확인할 수 있습니다.'>
            <Table
              data={data?.data || []}
              columns={columns}
              isLoading={isLoading}
              emptyMessage='전송된 알림이 없습니다.'
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
