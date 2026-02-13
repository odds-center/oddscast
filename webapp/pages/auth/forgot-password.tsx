import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Layout from '@/components/Layout';
import { routes } from '@/lib/routes';
import Icon from '@/components/icons';
import Link from 'next/link';
import BackLink from '@/components/page/BackLink';
import FormInput from '@/components/page/FormInput';
import SectionCard from '@/components/page/SectionCard';
import AuthApi from '@/lib/api/authApi';
import { getErrorMessage } from '@/lib/utils/error';
import { useMutation } from '@tanstack/react-query';

type ForgotPasswordForm = {
  email: string;
};

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ForgotPasswordForm>();

  const mutation = useMutation({
    mutationFn: (em: string) => AuthApi.forgotPassword(em),
    onSuccess: () => setSent(true),
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    mutation.mutate(data.email);
  };

  const email = watch('email', '');

  return (
    <Layout title='GOLDEN RACE'>
      <div className='max-w-sm md:max-w-md mx-auto'>
        {sent ? (
          <SectionCard>
            <p className='text-foreground font-medium mb-2'>
              이메일을 확인해주세요.
            </p>
            <p className='text-text-secondary text-sm'>
              {email}로 비밀번호 재설정 링크를 발송했습니다. 링크를 클릭하여 새 비밀번호를 설정하세요.
            </p>
            <Link href={routes.auth.login} className='btn-primary inline-flex items-center gap-2 mt-4'>
              <Icon name='LogIn' size={18} />
              로그인
            </Link>
          </SectionCard>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <FormInput
              label='이메일'
              type='email'
              {...register('email', { required: '이메일을 입력하세요.' })}
              error={errors.email?.message}
            />
            {mutation.isError && (
              <p className='msg-error'>
                {getErrorMessage(mutation.error)}
              </p>
            )}
            <button
              type='submit'
              disabled={mutation.isPending || isSubmitting}
              className='btn-primary w-full py-2 disabled:opacity-50 flex items-center gap-2'
            >
              {mutation.isPending ? (
                <>
                  <Icon name='Loader2' size={18} className='animate-spin' />
                  전송 중...
                </>
              ) : (
                '재설정 링크 발송'
              )}
            </button>
          </form>
        )}

        <p className='mt-6 text-text-secondary text-sm'>
          <BackLink href={routes.auth.login} label='로그인' />
        </p>
      </div>
    </Layout>
  );
}
