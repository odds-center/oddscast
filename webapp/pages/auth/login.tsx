import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
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

function KakaoIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='#191919' aria-hidden='true'>
      <path d='M12 3C6.477 3 2 6.477 2 10.5c0 2.526 1.412 4.742 3.527 6.094L4.43 20.078a.5.5 0 0 0 .7.576l4.9-2.876A11.4 11.4 0 0 0 12 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z' />
    </svg>
  );
}

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
      <div className='flex flex-col items-center py-4 sm:py-8'>

        {/* Back link */}
        <div className='w-full max-w-[400px] mb-4'>
          <Link
            href={routes.home}
            className='inline-flex items-center gap-1 text-sm text-text-secondary hover:text-foreground transition-colors'
          >
            <Icon name='ChevronLeft' size={16} />
            홈으로
          </Link>
        </div>

        {/* Card */}
        <div className='w-full max-w-[400px] bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden'>

          {/* Brand header strip */}
          <div className='bg-gradient-to-br from-primary to-green-700 px-6 py-6 text-white'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center'>
                <Icon name='Horse' size={22} className='text-white' />
              </div>
              <div>
                <p className='text-xs font-medium text-green-100'>AI 경마 분석 서비스</p>
                <h1 className='text-lg font-bold tracking-tight'>OddsCast</h1>
              </div>
            </div>
            <p className='mt-3 text-sm text-green-100 leading-relaxed'>
              로그인하고 AI 경마 예측을 확인해보세요.
            </p>
          </div>

          <div className='px-6 py-6 space-y-4'>

            {/* Error alert */}
            {kakaoError && (
              <div className='flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5'>
                <Icon name='AlertCircle' size={15} className='text-red-500 shrink-0' />
                <p className='text-sm text-red-700'>카카오 로그인에 실패했습니다.</p>
              </div>
            )}

            {/* Kakao — primary social CTA */}
            <a
              href={`${serverBaseUrl}/api/auth/kakao`}
              className='flex items-center justify-center gap-2.5 w-full py-3 rounded-xl bg-[#FEE500] hover:bg-[#F0D800] active:bg-[#E0C900] text-[#191919] font-semibold text-[15px] transition-colors touch-manipulation min-h-[48px]'
            >
              <KakaoIcon />
              카카오로 계속하기
            </a>

            {/* Divider */}
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-stone-200' />
              </div>
              <div className='relative flex justify-center text-xs'>
                <span className='bg-white px-3 text-text-secondary'>또는 이메일로 로그인</span>
              </div>
            </div>

            {/* Email / Password form */}
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-3'>
              <FormInput
                label='이메일'
                type='email'
                autoComplete='email'
                placeholder='example@email.com'
                {...register('email', { required: '이메일을 입력하세요.' })}
                error={errors.email?.message}
              />
              <div>
                <FormInput
                  label='비밀번호'
                  type='password'
                  autoComplete='current-password'
                  placeholder='비밀번호 입력'
                  {...register('password', { required: '비밀번호를 입력하세요.' })}
                  error={errors.password?.message}
                />
                <div className='flex justify-end mt-1.5'>
                  <Link
                    href={routes.auth.forgotPassword}
                    className='text-xs text-text-secondary hover:text-primary transition-colors'
                  >
                    비밀번호 찾기
                  </Link>
                </div>
              </div>

              {errors.root && (
                <div className='flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5'>
                  <Icon name='AlertCircle' size={14} className='text-red-500 shrink-0' />
                  <p className='text-sm text-red-700'>{errors.root.message}</p>
                </div>
              )}

              <Button
                type='submit'
                disabled={isSubmitting}
                className='w-full min-h-[48px] rounded-xl text-[15px]'
              >
                {isSubmitting ? (
                  <span className='flex items-center justify-center gap-2'>
                    <Icon name='Loader2' size={18} className='animate-spin' />
                    로그인 중...
                  </span>
                ) : (
                  '이메일로 로그인'
                )}
              </Button>
            </form>
          </div>

          {/* Card footer */}
          <div className='px-6 pb-6 text-center'>
            <p className='text-sm text-text-secondary'>
              계정이 없으신가요?{' '}
              <Link href={routes.auth.register} className='font-semibold text-primary hover:underline'>
                무료 회원가입
              </Link>
            </p>
          </div>
        </div>

        {/* Legal note */}
        <p className='mt-5 text-xs text-text-secondary text-center max-w-[320px] leading-relaxed'>
          로그인 시{' '}
          <Link href={routes.legal.terms} className='underline hover:text-foreground'>이용약관</Link>
          {' '}및{' '}
          <Link href={routes.legal.privacy} className='underline hover:text-foreground'>개인정보처리방침</Link>
          에 동의하게 됩니다.
        </p>
      </div>
    </Layout>
  );
}
