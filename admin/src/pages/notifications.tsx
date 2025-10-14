import { useState } from 'react';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import Pagination from '@/components/common/Pagination';
import { adminNotificationsApi } from '@/lib/api/admin';
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

// Zod 스키마
const notificationSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100, '제목은 100자 이내로 입력해주세요'),
  message: z.string().min(1, '내용을 입력해주세요').max(500, '내용은 500자 이내로 입력해주세요'),
  target: z.enum(['all', 'active', 'subscribers']),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // react-hook-form 설정
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      message: '',
      target: 'all',
    },
    mode: 'onChange',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications', page],
    queryFn: () => adminNotificationsApi.getAll({ page, limit: 20 }),
  });

  const sendNotificationMutation = useMutation({
    mutationFn: (data: NotificationFormData) => adminNotificationsApi.send(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast.success('알림이 전송되었습니다!');
      reset();
    },
    onError: (error) => {
      console.error('알림 전송 실패:', error);
      toast.error('알림 전송에 실패했습니다.');
    },
  });

  const onSubmit = (data: NotificationFormData) => {
    sendNotificationMutation.mutate(data);
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
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>제목</label>
                <input
                  type='text'
                  {...register('title')}
                  className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
                  placeholder='알림 제목을 입력하세요'
                />
                {errors.title && (
                  <p className='text-red-500 text-sm mt-1'>{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>내용</label>
                <textarea
                  rows={4}
                  {...register('message')}
                  className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
                  placeholder='알림 내용을 입력하세요'
                />
                {errors.message && (
                  <p className='text-red-500 text-sm mt-1'>{errors.message.message}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>전송 대상</label>
                <select
                  {...register('target')}
                  className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
                >
                  <option value='all'>전체 회원</option>
                  <option value='active'>활성 회원</option>
                  <option value='subscribers'>구독자</option>
                </select>
              </div>

              <Button
                type='submit'
                className='w-full'
                disabled={sendNotificationMutation.isPending || !isValid}
              >
                <Bell className='w-4 h-4 mr-2' />
                {sendNotificationMutation.isPending ? '전송 중...' : '알림 전송'}
              </Button>
            </form>
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
