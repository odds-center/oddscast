import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Layout from '@/components/Layout';
import { routes } from '@/lib/routes';
import Link from 'next/link';
import BackLink from '@/components/page/BackLink';
import AuthCard from '@/components/page/AuthCard';
import Icon from '@/components/icons';
import FormInput from '@/components/page/FormInput';
import AuthApi from '@/lib/api/authApi';
import { getErrorMessage } from '@/lib/utils/error';
import { useMutation } from '@tanstack/react-query';

type ResetPasswordForm = {
  newPassword: string;
  confirmPassword: string;
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>();

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordForm) =>
      AuthApi.resetPassword({ token: token as string, newPassword: data.newPassword }),
    onSuccess: () => {
      router.push(routes.auth.login);
    },
    onError: (err: unknown) => {
      setError('root', { message: getErrorMessage(err) });
    },
  });

  const onSubmit = (data: ResetPasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      setError('confirmPassword', { message: '비밀번호가 일치하지 않습니다.' });
      return;
    }
    mutation.mutate(data);
  };

  if (!token && typeof window !== 'undefined' && router.isReady) {
    return (
      <Layout title='비밀번호 재설정 — OddsCast'>
        <div className='max-w-[400px] mx-auto px-4 py-6 sm:py-8'>
          <AuthCard
            title='링크를 확인해주세요'
            description='비밀번호 재설정 링크에 토큰이 없습니다. 이메일의 링크를 다시 확인해주세요.'
          >
            <Link
              href={routes.auth.forgotPassword}
              className='btn-primary w-full min-h-[44px] py-3 inline-flex items-center justify-center gap-2 rounded-lg text-[16px]'
            >
              <Icon name='Mail' size={20} />
              비밀번호 찾기
            </Link>
          </AuthCard>
          <div className='mt-6 flex justify-center'>
            <BackLink href={routes.auth.login} label='로그인으로' />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title='비밀번호 재설정 — OddsCast'>
      <div className='max-w-[400px] mx-auto px-4 py-6 sm:py-8'>
        <AuthCard
          title='비밀번호 재설정'
          description='새 비밀번호를 입력하세요. (6자 이상)'
        >
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <FormInput
              label='새 비밀번호'
              type='password'
              autoComplete='new-password'
              placeholder='6자 이상'
              {...register('newPassword', {
                required: '비밀번호를 입력하세요.',
                minLength: { value: 6, message: '6자 이상 입력하세요.' },
              })}
              error={errors.newPassword?.message}
            />
            <FormInput
              label='비밀번호 확인'
              type='password'
              autoComplete='new-password'
              {...register('confirmPassword', {
                required: '비밀번호를 다시 입력하세요.',
                validate: (v) =>
                  v === getValues('newPassword') || '비밀번호가 일치하지 않습니다.',
              })}
              error={errors.confirmPassword?.message}
            />
            {errors.root && (
              <p className='msg-error text-sm'>{errors.root.message}</p>
            )}
            <button
              type='submit'
              disabled={isSubmitting || mutation.isPending}
              className='btn-primary w-full min-h-[44px] py-3 disabled:opacity-50 flex items-center justify-center gap-2 rounded-lg text-[16px]'
            >
              {mutation.isPending ? (
                <>
                  <Icon name='Loader2' size={20} className='animate-spin' />
                  처리 중...
                </>
              ) : (
                '비밀번호 변경'
              )}
            </button>
          </form>
        </AuthCard>

        <div className='mt-6 flex justify-center'>
          <BackLink href={routes.auth.login} label='로그인으로' />
        </div>
      </div>
    </Layout>
  );
}
