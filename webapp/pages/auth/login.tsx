import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import AuthCard from '@/components/page/AuthCard';
import { routes } from '@/lib/routes';
import Link from 'next/link';
import Icon from '@/components/icons';
import FormInput from '@/components/page/FormInput';
import { Button } from '@/components/ui/button';
import AuthApi from '@/lib/api/authApi';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuthStore } from '@/lib/store/authStore';
import CONFIG from '@/lib/config';

type LoginForm = {
  email: string;
  password: string;
};

// Derive server root from NEXT_PUBLIC_API_URL (strip trailing /api)
const serverBaseUrl = CONFIG.api.server.baseURL.replace(/\/api$/, '');

export default function Login() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const kakaoError = router.query.error === 'kakao_failed';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await AuthApi.login(data);
      if ('accessToken' in res && res.accessToken) {
        setAuth(res.accessToken, res.user, res.refreshToken);
        router.push(routes.home);
      }
    } catch (err: unknown) {
      setError('root', { message: getErrorMessage(err) });
    }
  };

  return (
    <Layout title='로그인 | OddsCast' description='OddsCast 로그인 - AI 경마 분석 서비스'>
      <div className='max-w-[400px] mx-auto px-4 py-6 sm:py-8'>
        <CompactPageTitle title='로그인' backHref={routes.home} />
        <AuthCard
          title='로그인'
          description='OddsCast 계정으로 로그인하세요.'
        >
          {kakaoError && (
            <p className='text-error text-sm mb-2'>
              카카오 로그인에 실패했습니다. 다시 시도해주세요.
            </p>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <FormInput
              label='이메일'
              type='email'
              autoComplete='email'
              placeholder='example@email.com'
              {...register('email', { required: '이메일을 입력하세요.' })}
              error={errors.email?.message}
            />
            <FormInput
              label='비밀번호'
              type='password'
              autoComplete='current-password'
              {...register('password', { required: '비밀번호를 입력하세요.' })}
              error={errors.password?.message}
            />
            {errors.root && (
              <p className='text-error text-sm'>{errors.root.message}</p>
            )}
            <div className='flex justify-end'>
              <Link
                href={routes.auth.forgotPassword}
                className='text-sm text-text-secondary hover:text-primary transition-colors touch-manipulation min-h-[44px] sm:min-h-0 inline-flex items-center'
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='w-full py-3 rounded-lg text-[16px]'
            >
              {isSubmitting ? (
                <>
                  <Icon name='Loader2' size={20} className='animate-spin' />
                  로그인 중...
                </>
              ) : (
                <>
                  <Icon name='LogIn' size={20} />
                  로그인
                </>
              )}
            </Button>
          </form>
        </AuthCard>

        {/* Social login divider */}
        <div className='relative my-6'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-stone-200' />
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='bg-[#f8faf8] px-3 text-text-secondary'>또는</span>
          </div>
        </div>

        {/* Kakao login button */}
        <a
          href={`${serverBaseUrl}/api/auth/kakao`}
          className='flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#FEE500] hover:bg-[#F0D800] active:bg-[#E0C900] text-[#191919] font-semibold text-[15px] transition-colors touch-manipulation min-h-[44px]'
        >
          <svg width='20' height='20' viewBox='0 0 24 24' fill='#191919' aria-hidden='true'>
            <path d='M12 3C6.477 3 2 6.477 2 10.5c0 2.526 1.412 4.742 3.527 6.094L4.43 20.078a.5.5 0 0 0 .7.576l4.9-2.876A11.4 11.4 0 0 0 12 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z' />
          </svg>
          카카오로 계속하기
        </a>

        <p className='mt-6 text-center text-text-secondary text-sm'>
          계정이 없으신가요?{' '}
          <Link
            href={routes.auth.register}
            className='font-medium text-primary hover:underline'
          >
            회원가입
          </Link>
        </p>
      </div>
    </Layout>
  );
}
