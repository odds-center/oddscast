import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Layout from '@/components/Layout';
import { routes } from '@/lib/routes';
import Link from 'next/link';
import BackLink from '@/components/page/BackLink';
import Icon from '@/components/icons';
import PageHeader from '@/components/page/PageHeader';
import FormInput from '@/components/page/FormInput';
import AuthApi from '@/lib/api/authApi';
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
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>();

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordForm) =>
      AuthApi.resetPassword({ token: token as string, newPassword: data.newPassword }),
    onSuccess: () => {
      router.push(routes.auth.login);
    },
    onError: (err: any) => {
      setError('root', { message: err?.message || '비밀번호 재설정에 실패했습니다.' });
    },
  });

  const newPassword = watch('newPassword', '');

  const onSubmit = (data: ResetPasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      setError('confirmPassword', { message: '비밀번호가 일치하지 않습니다.' });
      return;
    }
    mutation.mutate(data);
  };

  if (!token && typeof window !== 'undefined' && router.isReady) {
    return (
      <Layout title='비밀번호 재설정 — GOLDEN RACE'>
        <div className='max-w-sm md:max-w-md mx-auto'>
          <PageHeader
            icon='AlertCircle'
            title='링크가 올바르지 않습니다'
            description='비밀번호 재설정 링크에 토큰이 없습니다. 이메일의 링크를 다시 확인해주세요.'
          />
          <Link href={routes.auth.forgotPassword} className='btn-primary inline-flex items-center gap-2'>
            <Icon name='Mail' size={18} />
            비밀번호 찾기
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title='비밀번호 재설정 — GOLDEN RACE'>
      <div className='max-w-sm md:max-w-md mx-auto'>
        <PageHeader
          icon='Key'
          title='비밀번호 재설정'
          description='새 비밀번호를 입력해주세요. (6자 이상)'
        />

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <FormInput
            label='새 비밀번호'
            type='password'
            {...register('newPassword', {
              required: '비밀번호를 입력하세요.',
              minLength: { value: 6, message: '6자 이상 입력하세요.' },
            })}
            error={errors.newPassword?.message}
          />
          <FormInput
            label='비밀번호 확인'
            type='password'
            {...register('confirmPassword', {
              required: '비밀번호를 다시 입력하세요.',
              validate: (v) => v === newPassword || '비밀번호가 일치하지 않습니다.',
            })}
            error={errors.confirmPassword?.message}
          />
          {errors.root && <p className='msg-error'>{errors.root.message}</p>}
          <button
            type='submit'
            disabled={isSubmitting || mutation.isPending}
            className='btn-primary w-full py-2 disabled:opacity-50 flex items-center justify-center gap-2'
          >
            {mutation.isPending ? (
              <>
                <Icon name='Loader2' size={18} className='animate-spin' />
                처리 중...
              </>
            ) : (
              '비밀번호 변경'
            )}
          </button>
        </form>

        <p className='mt-6 text-text-secondary text-sm'>
          <BackLink href={routes.auth.login} label='로그인' />
        </p>
      </div>
    </Layout>
  );
}
