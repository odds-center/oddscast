import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Layout from '@/components/Layout';
import { routes } from '@/lib/routes';
import Icon from '@/components/icons';
import Link from 'next/link';
import BackLink from '@/components/page/BackLink';
import AuthCard from '@/components/page/AuthCard';
import FormInput from '@/components/page/FormInput';
import AuthApi from '@/lib/api/authApi';
import { getErrorMessage } from '@/lib/utils/error';
import { useMutation } from '@tanstack/react-query';

type ForgotPasswordForm = {
  email: string;
};

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordForm>();

  const mutation = useMutation({
    mutationFn: (em: string) => AuthApi.forgotPassword(em),
    onSuccess: (_, email) => {
      setSent(true);
      setSubmittedEmail(email);
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    mutation.mutate(data.email);
  };

  return (
    <Layout title='비밀번호 찾기 | OddsCast'>
      <div className='max-w-[400px] mx-auto px-4 py-6 sm:py-8'>
        {sent ? (
          <AuthCard
            title='이메일을 확인해주세요'
            description={`${submittedEmail}로 비밀번호 재설정 링크를 발송했습니다.`}
          >
            <p className='text-text-secondary text-sm mb-6'>
              메일함에서 링크를 클릭하여 새 비밀번호를 설정하세요.
            </p>
            <Link
              href={routes.auth.login}
              className='btn-primary w-full min-h-[44px] py-3 inline-flex items-center justify-center gap-2 rounded-lg text-[16px]'
            >
              <Icon name='LogIn' size={20} />
              로그인
            </Link>
          </AuthCard>
        ) : (
          <AuthCard
            title='비밀번호 찾기'
            description='가입한 이메일을 입력하면 재설정 링크를 보내드립니다.'
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
              {mutation.isError && (
                <p className='msg-error text-sm'>
                  {getErrorMessage(mutation.error)}
                </p>
              )}
              <button
                type='submit'
                disabled={mutation.isPending || isSubmitting}
                className='btn-primary w-full min-h-[44px] py-3 disabled:opacity-50 flex items-center justify-center gap-2 rounded-lg text-[16px]'
              >
                {mutation.isPending ? (
                  <>
                    <Icon name='Loader2' size={20} className='animate-spin' />
                    전송 중...
                  </>
                ) : (
                  '재설정 링크 발송'
                )}
              </button>
            </form>
          </AuthCard>
        )}

        <div className='mt-6 flex justify-center'>
          <BackLink href={routes.auth.login} label='로그인으로' />
        </div>
      </div>
    </Layout>
  );
}
