import { useEffect, useState } from 'react';
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
import ConfigApi from '@/lib/api/configApi';
import { useAuthStore } from '@/lib/store/authStore';
import GoogleSignInButton from '@/components/GoogleSignInButton';

type RegisterForm = {
  email: string;
  password: string;
  name: string;
  nickname: string;
};

export default function Register() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showGoogleLogin, setShowGoogleLogin] = useState(true);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  useEffect(() => {
    ConfigApi.getShowGoogleLogin()
      .then(setShowGoogleLogin)
      .catch(() => setShowGoogleLogin(true));
  }, []);

  const onSubmit = async (data: RegisterForm) => {
    try {
      const res = await AuthApi.register({
        email: data.email,
        password: data.password,
        name: data.name,
        nickname: data.nickname,
      });
      if (res?.accessToken) {
        setAuth(res.accessToken, res.user);
        router.push(routes.home);
      }
    } catch (err: unknown) {
      setError('root', { message: getErrorMessage(err) });
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    setError('root', { message: '' });
    try {
      const res = await AuthApi.googleLogin(idToken);
      if (res?.accessToken) {
        setAuth(res.accessToken, res.user);
        router.push(routes.home);
      }
    } catch (err: unknown) {
      setError('root', { message: getErrorMessage(err) });
    }
  };

  return (
    <Layout title='OddsCast'>
      <div className='max-w-sm md:max-w-md mx-auto'>
        {showGoogleLogin && (
          <>
            <div className='mb-4'>
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={(msg) => setError('root', { message: msg })}
                theme='outline'
                size='large'
                text='continue_with'
              />
            </div>
            <div className='relative my-4'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-border' />
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-background text-text-secondary'>또는</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <FormInput
            label='이메일'
            type='email'
            {...register('email', { required: '이메일을 입력하세요.' })}
            error={errors.email?.message}
          />
          <FormInput
            label='비밀번호 (6자 이상)'
            type='password'
            {...register('password', {
              required: '비밀번호를 입력하세요.',
              minLength: { value: 6, message: '6자 이상 입력하세요.' },
            })}
            error={errors.password?.message}
          />
          <FormInput
            label='이름'
            type='text'
            {...register('name', { required: '이름을 입력하세요.' })}
            error={errors.name?.message}
          />
          <FormInput
            label='닉네임'
            type='text'
            {...register('nickname', {
              required: '닉네임을 입력하세요.',
              minLength: { value: 2, message: '닉네임은 2자 이상이어야 합니다.' },
            })}
            error={errors.nickname?.message}
          />
          {errors.root && <p className='msg-error'>{errors.root.message}</p>}
          <button
            type='submit'
            disabled={isSubmitting}
            className='btn-primary w-full py-2 disabled:opacity-50 flex items-center gap-2'
          >
            {isSubmitting ? (
              <>
                <Icon name='Loader2' size={18} className='animate-spin' />
                가입 중...
              </>
            ) : (
              <>
                <Icon name='UserPlus' size={18} />
                회원가입
              </>
            )}
          </button>
        </form>
        <p className='mt-3 md:mt-4 text-text-secondary text-sm'>
          이미 계정이 있으신가요?{' '}
          <Link href={routes.auth.login} className='link-primary'>
            로그인
          </Link>
        </p>
        <BackLink href={routes.home} label='홈으로' className='mt-6 block' />
      </div>
    </Layout>
  );
}
