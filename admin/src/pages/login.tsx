import { useRouter } from 'next/router';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/lib/hooks/useAuth';
type LoginForm = {
  loginId: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<LoginForm>({
    defaultValues: { loginId: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await authApi.login({ loginId: data.loginId, password: data.password });
      setAuth(response.user, response.accessToken);
      const redirect = (router.query.redirect as string) || '/';
      window.location.href = redirect.startsWith('/') ? redirect : `/${redirect}`;
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
          : undefined;
      const text = Array.isArray(msg) ? msg.join(', ') : msg;
      setError('root', {
        message: text || '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.',
      });
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
          <form className='mt-5 space-y-4' onSubmit={handleSubmit(onSubmit)}>
            <div className='rounded-md shadow-sm -space-y-px'>
              <div>
                <label htmlFor='loginId' className='sr-only'>
                  아이디
                </label>
                <input
                  id='loginId'
                  type='text'
                  autoComplete='username'
                  placeholder='아이디'
                  className='appearance-none rounded-none relative block w-full px-3 py-1.5 text-sm border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm'
                  {...register('loginId', { required: '아이디를 입력하세요.' })}
                />
              </div>
              <div>
                <label htmlFor='password' className='sr-only'>
                  비밀번호
                </label>
                <input
                  id='password'
                  type='password'
                  autoComplete='current-password'
                  placeholder='비밀번호'
                  className='appearance-none rounded-none relative block w-full px-3 py-1.5 text-sm border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm'
                  {...register('password', { required: '비밀번호를 입력하세요.' })}
                />
              </div>
            </div>

            {(errors.root ?? errors.loginId ?? errors.password) && (
              <div className='rounded bg-red-50 p-3'>
                <p className='text-sm text-red-800'>
                  {errors.root?.message ?? errors.loginId?.message ?? errors.password?.message}
                </p>
              </div>
            )}

            <div>
              <button
                type='submit'
                disabled={isSubmitting}
                className='group relative w-full flex justify-center items-center gap-2 py-1.5 px-4 border text-sm border-transparent font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className='animate-spin h-4 w-4 text-white'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      />
                    </svg>
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}