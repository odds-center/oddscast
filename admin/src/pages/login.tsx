import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.login({ loginId, password });

      // Zustand 스토어에 인증 정보 저장
      setAuth(response.user, response.accessToken);

      // 쿠키/스토어 반영 후 전체 페이지 로드로 이동 (미들웨어 인식 보장)
      const redirect = (router.query.redirect as string) || '/';
      window.location.href = redirect.startsWith('/') ? redirect : `/${redirect}`;
    } catch (err: unknown) {
      console.error('Login error:', err);
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
        : undefined;
      const text = Array.isArray(msg) ? msg.join(', ') : msg;
      setError(text || '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>로그인 | GoldenRace Admin</title>
      </Head>
      <div className='min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-5'>
        <div className='max-w-sm w-full space-y-5'>
          <div>
            <h2 className='mt-4 text-center text-xl font-bold text-gray-900'>
              GoldenRace Admin
            </h2>
            <p className='mt-1 text-center text-sm text-gray-600'>관리자 계정으로 로그인하세요</p>
          </div>
          <form className='mt-5 space-y-4' onSubmit={handleSubmit}>
            <div className='rounded-md shadow-sm -space-y-px'>
              <div>
                <label htmlFor='loginId' className='sr-only'>
                  아이디
                </label>
                <input
                  id='loginId'
                  name='loginId'
                  type='text'
                  autoComplete='username'
                  required
                  className='appearance-none rounded-none relative block w-full px-3 py-1.5 text-sm border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm'
                  placeholder='아이디'
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor='password' className='sr-only'>
                  비밀번호
                </label>
                <input
                  id='password'
                  name='password'
                  type='password'
                  autoComplete='current-password'
                  required
                  className='appearance-none rounded-none relative block w-full px-3 py-1.5 text-sm border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm'
                  placeholder='비밀번호'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className='rounded bg-red-50 p-3'>
                <p className='text-sm text-red-800'>{error}</p>
              </div>
            )}

            <div>
              <button
                type='submit'
                disabled={isLoading}
                className='group relative w-full flex justify-center py-1.5 px-4 border text-sm border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
