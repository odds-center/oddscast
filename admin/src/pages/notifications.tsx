import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

export default function NotificationsPage() {
  return (
    <>
      <Head>
        <title>알림 관리 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>알림 관리</h1>
              <p className='mt-2 text-sm text-gray-600'>
                사용자에게 보낼 알림을 관리할 수 있습니다.
              </p>
            </div>
            <Button>알림 전송</Button>
          </div>

          <Card>
            <div className='text-center py-12 text-gray-500'>
              <p className='text-lg mb-2'>알림 목록이 표시될 영역입니다.</p>
              <p className='text-sm'>푸시 알림, 이메일 알림 등을 관리할 수 있습니다.</p>
            </div>
          </Card>
        </div>
      </Layout>
    </>
  );
}
