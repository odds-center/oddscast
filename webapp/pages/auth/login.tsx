import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import BackLink from '@/components/page/BackLink';
import { routes } from '@/lib/routes';
import Link from 'next/link';
import Icon from '@/components/icons';
import FormInput from '@/components/page/FormInput';
import AuthApi from '@/lib/api/authApi';
import { getErrorMessage } from '@/lib/utils/error';
import { useAuthStore } from '@/lib/store/authStore';
import type { LoginBonusResult } from '@/lib/types/auth';

type LoginForm = {
  email: string;
  password: string;
};

function formatLoginBonusMessage(b: LoginBonusResult): string | null {
  const parts: string[] = [];
  if (b.dailyBonusGranted && b.dailyBonusPoints > 0) {
    parts.push(`일일 로그인 보너스 ${b.dailyBonusPoints}P 적립`);
  }
  if (b.consecutiveRewardGranted) {
    parts.push('7일 연속 로그인 보상으로 예측권 1장이 지급되었습니다.');
  }
  if (b.consecutiveDays > 0 && !b.consecutiveRewardGranted) {
    parts.push(`${b.consecutiveDays}일 연속 로그인`);
  }
  return parts.length ? parts.join('. ') : null;
}

export default function Login() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loginBonusMessage, setLoginBonusMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await AuthApi.login(data);
      if (res?.accessToken) {
        setAuth(res.accessToken, res.user);
        if (res.loginBonus) {
          const msg = formatLoginBonusMessage(res.loginBonus);
          if (msg) {
            setLoginBonusMessage(msg);
            setTimeout(() => router.push(routes.home), 2200);
            return;
          }
        }
        router.push(routes.home);
      }
    } catch (err: unknown) {
      setError('root', { message: getErrorMessage(err) });
    }
  };

  return (
    <Layout title='OddsCast'>
      <div className='max-w-sm md:max-w-md mx-auto'>
        {loginBonusMessage && (
          <div
            className='mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-sm'
            role='alert'
          >
            {loginBonusMessage}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <FormInput
            label='이메일'
            type='email'
            {...register('email', { required: '이메일을 입력하세요.' })}
            error={errors.email?.message}
          />
          <FormInput
            label='비밀번호'
            type='password'
            {...register('password', { required: '비밀번호를 입력하세요.' })}
            error={errors.password?.message}
          />
          {errors.root && <p className='msg-error'>{errors.root.message}</p>}
          <p className='text-text-tertiary text-xs'>
            <Link href={routes.auth.forgotPassword} className='link-primary'>
              비밀번호를 잊으셨나요?
            </Link>
          </p>
          <button
            type='submit'
            disabled={isSubmitting}
            className='btn-primary w-full py-2 disabled:opacity-50 flex items-center gap-2'
          >
            {isSubmitting ? (
              <>
                <Icon name='Loader2' size={18} className='animate-spin' />
                로그인 중...
              </>
            ) : (
              <>
                <Icon name='LogIn' size={18} />
                로그인
              </>
            )}
          </button>
        </form>
        <p className='mt-3 md:mt-4 text-text-secondary text-sm'>
          계정이 없으신가요?{' '}
          <Link href={routes.auth.register} className='link-primary'>
            회원가입
          </Link>
        </p>
        <BackLink href={routes.home} label='홈으로' className='mt-6 block' />
      </div>
    </Layout>
  );
}
