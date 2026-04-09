import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import { Button } from '@/components/ui/button';
import FormInput from '@/components/page/FormInput';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import SectionCard from '@/components/page/SectionCard';
import { TabBar } from '@/components/ui';
import RequireLogin from '@/components/page/RequireLogin';
import { routes } from '@/lib/routes';
import AuthApi from '@/lib/api/authApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/utils/error';

type ProfileForm = {
  nickname: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export default function ProfileEditPage() {
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  const profileForm = useForm<ProfileForm>({ defaultValues: { nickname: '' } });
  const passwordForm = useForm<PasswordForm>({
    defaultValues: { currentPassword: '', newPassword: '', newPasswordConfirm: '' },
  });

  const { data: currentUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => AuthApi.getCurrentUser(),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const u = currentUser ?? user;
    if (u) {
      const uExt = u as { nickname?: string; avatar?: string };
      profileForm.reset({ nickname: uExt.nickname ?? '' });
    }
    // profileForm.reset is only called when currentUser/user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps -- profileForm is intentionally excluded
  }, [currentUser, user]);

  const profileMutation = useMutation({
    mutationFn: (data: { nickname?: string }) => AuthApi.updateProfile(data),
    onSuccess: (updated) => {
      const token = useAuthStore.getState().token;
      if (token)
        setAuth(token, updated as { id: string; email: string; nickname?: string });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: { oldPassword: string; newPassword: string }) =>
      AuthApi.changePassword(data),
    onSuccess: () => {
      passwordForm.reset();
    },
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  const onProfileSubmit = (data: ProfileForm) => {
    profileMutation.mutate({ nickname: data.nickname });
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    // Validation is handled by react-hook-form rules (minLength, validate).
    // This callback is only reached when all rules pass.
    passwordMutation.mutate({ oldPassword: data.currentPassword, newPassword: data.newPassword });
  };

  const newPassword = useWatch({ control: passwordForm.control, name: 'newPassword', defaultValue: '' });
  const newPasswordConfirm = useWatch({ control: passwordForm.control, name: 'newPasswordConfirm', defaultValue: '' });

  if (!isLoggedIn) {
    return (
      <Layout title='프로필 수정 | OddsCast'>
        <div className='max-w-md mx-auto'>
          <CompactPageTitle title='프로필 수정' backHref={routes.profile.index} />
          <RequireLogin suffix='프로필을 수정할 수 있습니다.' />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title='프로필 수정 | OddsCast'>
      <div className='max-w-md mx-auto space-y-6'>
        <CompactPageTitle title='프로필 수정' backHref={routes.profile.index} />
        <SectionCard
          title='프로필'
          icon='User'
          description={'이름·닉네임과 비밀번호를\n변경할 수 있습니다.'}
        >
        <TabBar
          options={[
            { value: 'profile', label: '기본 정보' },
            { value: 'password', label: '비밀번호' },
          ]}
          value={activeTab}
          onChange={(v) => setActiveTab(v)}
          variant='filled'
          size='md'
          className='mb-6'
        />

        {activeTab === 'profile' && (
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className='rounded-[10px] border border-border bg-card p-4 md:px-5 md:py-[1.125rem] space-y-4'>
            <FormInput
              label='닉네임'
              type='text'
              {...profileForm.register('nickname', {
                required: '닉네임을 입력하세요.',
                minLength: { value: 2, message: '닉네임은 2자 이상이어야 합니다.' },
              })}
              error={profileForm.formState.errors.nickname?.message}
            />
            {profileMutation.isError && (
              <p className='text-error'>
                {getErrorMessage(profileMutation.error) || '저장에 실패했습니다.'}
              </p>
            )}
            {profileMutation.isSuccess && <p className='text-success'>저장되었습니다.</p>}
            <Button
              type='submit'
              disabled={profileMutation.isPending}
              className='w-full py-2'
            >
              {profileMutation.isPending ? (
                <>
                  <Icon name='Loader2' size={18} className='animate-spin' />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className='rounded-[10px] border border-border bg-card p-4 md:px-5 md:py-[1.125rem] space-y-4'>
            <FormInput
              label='현재 비밀번호'
              type='password'
              {...passwordForm.register('currentPassword', {
                required: '현재 비밀번호를 입력하세요.',
              })}
              error={passwordForm.formState.errors.currentPassword?.message}
            />
            <div>
              <FormInput
                label='새 비밀번호'
                type='password'
                {...passwordForm.register('newPassword', {
                  required: '새 비밀번호를 입력하세요.',
                  minLength: { value: 6, message: '6자 이상 입력하세요.' },
                })}
                error={passwordForm.formState.errors.newPassword?.message}
              />
              <p className='text-text-tertiary text-xs mt-1'>6자 이상</p>
            </div>
            <FormInput
              label='새 비밀번호 확인'
              type='password'
              {...passwordForm.register('newPasswordConfirm', {
                required: '비밀번호 확인을 입력하세요.',
                validate: (v) => v === passwordForm.getValues('newPassword') || '비밀번호가 일치하지 않습니다.',
              })}
              error={passwordForm.formState.errors.newPasswordConfirm?.message}
            />
            {passwordMutation.isError && (
              <p className='text-error'>
                {getErrorMessage(passwordMutation.error) || '비밀번호 변경에 실패했습니다.'}
              </p>
            )}
            {passwordMutation.isSuccess && (
              <p className='text-success'>비밀번호가 변경되었습니다.</p>
            )}
            <Button
              type='submit'
              disabled={
                passwordMutation.isPending ||
                newPassword !== newPasswordConfirm ||
                newPassword.length < 6
              }
              className='w-full py-2'
            >
              {passwordMutation.isPending ? (
                <>
                  <Icon name='Loader2' size={18} className='animate-spin' />
                  변경 중...
                </>
              ) : (
                '비밀번호 변경'
              )}
            </Button>
          </form>
        )}
        </SectionCard>
      </div>
    </Layout>
  );
}
