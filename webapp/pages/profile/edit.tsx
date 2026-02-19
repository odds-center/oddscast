import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import FormInput from '@/components/page/FormInput';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import { TabBar } from '@/components/ui';
import RequireLogin from '@/components/page/RequireLogin';
import { routes } from '@/lib/routes';
import AuthApi from '@/lib/api/authApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/utils/error';

type ProfileForm = {
  name: string;
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

  const profileForm = useForm<ProfileForm>({ defaultValues: { name: '', nickname: '' } });
  const passwordForm = useForm<PasswordForm>({
    defaultValues: { currentPassword: '', newPassword: '', newPasswordConfirm: '' },
  });

  const { data: currentUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => AuthApi.getCurrentUser(),
    enabled: isLoggedIn,
  });

  useEffect(() => {
    const u = currentUser ?? user;
    if (u) {
      const uExt = u as { name?: string; nickname?: string; avatar?: string };
      profileForm.reset({ name: uExt.name ?? '', nickname: uExt.nickname ?? '' });
    }
    // profileForm.reset는 currentUser/user 변경 시에만 호출
    // eslint-disable-next-line react-hooks/exhaustive-deps -- profileForm은 의도적으로 제외
  }, [currentUser, user]);

  const profileMutation = useMutation({
    mutationFn: (data: { name?: string; nickname?: string }) => AuthApi.updateProfile(data),
    onSuccess: (updated) => {
      const token = useAuthStore.getState().token;
      if (token)
        setAuth(token, updated as { id: string; email: string; name: string; nickname?: string });
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
    profileMutation.mutate({ name: data.name, nickname: data.nickname });
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    if (data.newPassword !== data.newPasswordConfirm) return;
    if (data.newPassword.length < 6) return;
    passwordMutation.mutate({ oldPassword: data.currentPassword, newPassword: data.newPassword });
  };

  const newPassword = useWatch({ control: passwordForm.control, name: 'newPassword', defaultValue: '' });
  const newPasswordConfirm = useWatch({ control: passwordForm.control, name: 'newPasswordConfirm', defaultValue: '' });

  if (!isLoggedIn) {
    return (
      <Layout title='GOLDEN RACE'>
        <div className='max-w-md mx-auto'>
          <RequireLogin suffix='프로필을 수정할 수 있습니다.' />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title='GOLDEN RACE'>
      <div className='max-w-md mx-auto'>
        <CompactPageTitle title='프로필 수정' backHref={routes.profile.index} />
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
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className='card space-y-4'>
            <FormInput
              label='이름'
              type='text'
              {...profileForm.register('name', { required: '이름을 입력하세요.' })}
              error={profileForm.formState.errors.name?.message}
            />
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
              <p className='msg-error'>
                {getErrorMessage(profileMutation.error) || '저장에 실패했습니다.'}
              </p>
            )}
            {profileMutation.isSuccess && <p className='msg-success'>저장되었습니다.</p>}
            <button
              type='submit'
              disabled={profileMutation.isPending}
              className='btn-primary w-full py-2 disabled:opacity-50 flex items-center gap-2'
            >
              {profileMutation.isPending ? (
                <>
                  <Icon name='Loader2' size={18} className='animate-spin' />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </button>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className='card space-y-4'>
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
              <p className='msg-error'>
                {getErrorMessage(passwordMutation.error) || '비밀번호 변경에 실패했습니다.'}
              </p>
            )}
            {passwordMutation.isSuccess && (
              <p className='msg-success'>비밀번호가 변경되었습니다.</p>
            )}
            <button
              type='submit'
              disabled={
                passwordMutation.isPending ||
                newPassword !== newPasswordConfirm ||
                newPassword.length < 6
              }
              className='btn-primary w-full py-2 disabled:opacity-50 flex items-center gap-2'
            >
              {passwordMutation.isPending ? (
                <>
                  <Icon name='Loader2' size={18} className='animate-spin' />
                  변경 중...
                </>
              ) : (
                '비밀번호 변경'
              )}
            </button>
          </form>
        )}
      </div>
    </Layout>
  );
}
