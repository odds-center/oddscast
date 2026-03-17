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

type LoginForm = {
  email: string;
  password: string;
};

export default function Login() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

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
