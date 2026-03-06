import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import SectionCard from '@/components/page/SectionCard';
import FormInput from '@/components/page/FormInput';
import BackLink from '@/components/page/BackLink';
import RequireLogin from '@/components/page/RequireLogin';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/lib/store/authStore';
import AuthApi from '@/lib/api/authApi';
import { getErrorMessage } from '@/lib/utils/error';

type DeleteAccountForm = {
  password: string;
};

export default function DeleteAccountPage() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const logout = useAuthStore((s) => s.logout);
  const [confirmChecked, setConfirmChecked] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<DeleteAccountForm>();

  const onSubmit = async (data: DeleteAccountForm) => {
    try {
      await AuthApi.deleteAccount(data.password);
      logout();
      router.push(routes.home);
    } catch (err: unknown) {
      setError('root', { message: getErrorMessage(err) });
    }
  };

  if (!isLoggedIn) {
    return (
      <Layout title='회원탈퇴 | OddsCast'>
        <CompactPageTitle title='회원탈퇴' backHref={routes.settings} />
        <RequireLogin suffix='회원탈퇴를 진행할 수 있습니다.' />
        <BackLink href={routes.settings} label='설정으로' />
      </Layout>
    );
  }

  return (
    <Layout title='회원탈퇴 | OddsCast'>
      <div className='space-y-6'>
        <CompactPageTitle title='회원탈퇴' backHref={routes.settings} />

        <SectionCard
          title='회원탈퇴'
          icon='UserMinus'
          description='비밀번호를 입력하면 계정이 비활성화됩니다. 복구할 수 없습니다.'
        >
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <FormInput
              label='비밀번호 확인'
              type='password'
              autoComplete='current-password'
              placeholder='현재 비밀번호를 입력하세요'
              {...register('password', { required: '비밀번호를 입력하세요.' })}
              error={errors.password?.message}
            />
            <label className='flex items-start gap-3 cursor-pointer text-sm'>
              <input
                type='checkbox'
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                className='mt-1 rounded border-border accent-red-600'
                aria-describedby='delete-confirm-desc'
              />
              <span id='delete-confirm-desc' className='text-text-secondary'>
                탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다. 동의합니다.
              </span>
            </label>
            {errors.root && (
              <p className='msg-error text-sm'>{errors.root.message}</p>
            )}
            <button
              type='submit'
              disabled={isSubmitting || !confirmChecked}
              className='btn-secondary w-full py-2.5 flex items-center justify-center gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 disabled:opacity-50'
            >
              {isSubmitting ? (
                <>
                  <Icon name='Loader2' size={18} className='animate-spin' />
                  처리 중...
                </>
              ) : (
                <>
                  <Icon name='UserMinus' size={18} />
                  회원탈퇴
                </>
              )}
            </button>
          </form>
        </SectionCard>

        <BackLink href={routes.settings} label='설정으로' />
      </div>
    </Layout>
  );
}
