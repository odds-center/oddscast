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

type RegisterForm = {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  nickname: string;
};

export default function Register() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    try {
      const res = await AuthApi.register({
        email: data.email,
        password: data.password,
        name: data.name,
        nickname: data.nickname,
      });
      if ('requireVerification' in res && res.requireVerification) {
        router.push({
          pathname: routes.auth.verifyEmail,
          query: { email: data.email },
        });
        return;
      }
      if ('accessToken' in res && res.accessToken) {
        setAuth(res.accessToken, res.user, res.refreshToken);
        router.push(routes.home);
      }
    } catch (err: unknown) {
      setError('root', { message: getErrorMessage(err) });
    }
  };

  return (
    <Layout title='회원가입 | OddsCast' description='OddsCast 회원가입 - AI 경마 분석 서비스에 가입하세요.'>
      <div className='max-w-[400px] mx-auto px-4 py-6 sm:py-8'>
        <CompactPageTitle title='회원가입' backHref={routes.home} />
        <AuthCard
          title='회원가입'
          description='OddsCast와 함께 시작하세요.'
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
              autoComplete='new-password'
              placeholder='6자 이상'
              {...register('password', {
                required: '비밀번호를 입력하세요.',
                minLength: { value: 6, message: '6자 이상 입력하세요.' },
              })}
              error={errors.password?.message}
            />
            <FormInput
              label='비밀번호 확인'
              type='password'
              autoComplete='new-password'
              placeholder='비밀번호를 다시 입력하세요'
              {...register('confirmPassword', {
                required: '비밀번호를 다시 입력하세요.',
                validate: (v) =>
                  v === getValues('password') || '비밀번호가 일치하지 않습니다.',
              })}
              error={errors.confirmPassword?.message}
            />
            <FormInput
              label='이름'
              type='text'
              autoComplete='name'
              {...register('name', { required: '이름을 입력하세요.' })}
              error={errors.name?.message}
            />
            <FormInput
              label='닉네임'
              type='text'
              autoComplete='username'
              placeholder='2자 이상'
              {...register('nickname', {
                required: '닉네임을 입력하세요.',
                minLength: { value: 2, message: '닉네임은 2자 이상이어야 합니다.' },
              })}
              error={errors.nickname?.message}
            />
            {errors.root && (
              <p className='text-error text-sm'>{errors.root.message}</p>
            )}
            <Button
              type='submit'
              disabled={isSubmitting}
              className='w-full py-3 rounded-lg text-[16px]'
            >
              {isSubmitting ? (
                <>
                  <Icon name='Loader2' size={20} className='animate-spin' />
                  가입 중...
                </>
              ) : (
                <>
                  <Icon name='UserPlus' size={20} />
                  회원가입
                </>
              )}
            </Button>
          </form>
        </AuthCard>

        <p className='mt-6 text-center text-text-secondary text-sm'>
          이미 계정이 있으신가요?{' '}
          <Link
            href={routes.auth.login}
            className='font-medium text-primary hover:underline'
          >
            로그인
          </Link>
        </p>
      </div>
    </Layout>
  );
}
