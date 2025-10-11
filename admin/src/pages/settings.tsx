import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/router';
import { authApi } from '@/lib/api/auth';

export default function SettingsPage() {
  const { user, clearAuth } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await authApi.logout();
    clearAuth();
    router.push('/login');
  };

  return (
    <>
      <Head>
        <title>설정 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>설정</h1>
            <p className='mt-2 text-sm text-gray-600'>
              시스템 설정 및 관리자 정보를 관리할 수 있습니다.
            </p>
          </div>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <Card title='관리자 정보'>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>이메일</label>
                  <div className='mt-1 text-gray-900'>{user?.email || '-'}</div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>사용자명</label>
                  <div className='mt-1 text-gray-900'>{user?.username || '-'}</div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>역할</label>
                  <div className='mt-1'>
                    <span className='inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800'>
                      {user?.role || '-'}
                    </span>
                  </div>
                </div>
                <div className='border-t pt-4'>
                  <Button variant='ghost' className='w-full'>
                    비밀번호 변경
                  </Button>
                </div>
              </div>
            </Card>

            <Card title='시스템 설정'>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>배치 작업</label>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>자동 데이터 동기화</span>
                    <button className='relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200'>
                      <span className='inline-block h-4 w-4 transform rounded-full bg-white transition' />
                    </button>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>알림 설정</label>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>신규 회원 가입 알림</span>
                      <button className='relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600'>
                        <span className='inline-block h-4 w-4 transform translate-x-6 rounded-full bg-white transition' />
                      </button>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>고액 베팅 알림</span>
                      <button className='relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600'>
                        <span className='inline-block h-4 w-4 transform translate-x-6 rounded-full bg-white transition' />
                      </button>
                    </div>
                  </div>
                </div>

                <div className='border-t pt-4'>
                  <Button variant='danger' className='w-full' onClick={handleLogout}>
                    로그아웃
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    </>
  );
}
