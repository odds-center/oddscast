import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import AuthApi from '@/lib/api/authApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
      const uAny = u as any;
      profileForm.reset({ name: uAny.name ?? '', nickname: uAny.nickname ?? '' });
    }
  }, [currentUser, user]);

  const profileMutation = useMutation({
    mutationFn: (data: { name?: string; nickname?: string }) => AuthApi.updateProfile(data),
    onSuccess: (updated) => {
      const token = useAuthStore.getState().token;
      if (token) setAuth(token, updated as any);
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

  const newPassword = passwordForm.watch('newPassword');
  const newPasswordConfirm = passwordForm.watch('newPasswordConfirm');

  if (!isLoggedIn) {
    return (
      <Layout title='프로필 수정 — GOLDEN RACE'>
        <div className='text-center p-8'>
          <p className='text-text-secondary mb-4'>로그인이 필요합니다.</p>
          <Link href={routes.auth.login} className='link-primary'>
            로그인
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title='프로필 수정 — GOLDEN RACE'>
      <div className='max-w-md mx-auto'>
        <h1 className='text-lg md:text-2xl font-bold text-primary mb-4 md:mb-6 flex items-center gap-2'>
          <Icon name='User' size={28} />
          프로필 수정
        </h1>

        <div className='flex gap-2 mb-4'>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded font-medium ${
              activeTab === 'profile' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'
            }`}
          >
            기본 정보
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 rounded font-medium ${
              activeTab === 'password' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'
            }`}
          >
            비밀번호
          </button>
        </div>

        {activeTab === 'profile' && (
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className='card space-y-4'>
            <div>
              <label className='block text-sm font-medium mb-1'>이름</label>
              <input
                type='text'
                {...profileForm.register('name', { required: '이름을 입력하세요.' })}
                className='w-full px-3 py-2 rounded bg-secondary border border-border text-foreground'
              />
              {profileForm.formState.errors.name && (
                <p className='msg-error mt-1.5'>{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>닉네임</label>
              <input
                type='text'
                {...profileForm.register('nickname', {
                  required: '닉네임을 입력하세요.',
                  minLength: { value: 2, message: '닉네임은 2자 이상이어야 합니다.' },
                })}
                className='w-full px-3 py-2 rounded bg-secondary border border-border text-foreground'
              />
              {profileForm.formState.errors.nickname && (
                <p className='msg-error mt-1.5'>
                  {profileForm.formState.errors.nickname.message}
                </p>
              )}
            </div>
            {profileMutation.isError && (
              <p className='msg-error'>
                {(profileMutation.error as any)?.message || '저장에 실패했습니다.'}
              </p>
            )}
            {profileMutation.isSuccess && (
              <p className='msg-success'>저장되었습니다.</p>
            )}
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
            <div>
              <label className='block text-sm font-medium mb-1'>현재 비밀번호</label>
              <input
                type='password'
                {...passwordForm.register('currentPassword', { required: '현재 비밀번호를 입력하세요.' })}
                className='w-full px-3 py-2 rounded bg-secondary border border-border text-foreground'
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className='msg-error mt-1.5'>
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>새 비밀번호</label>
              <input
                type='password'
                {...passwordForm.register('newPassword', {
                  required: '새 비밀번호를 입력하세요.',
                  minLength: { value: 6, message: '6자 이상 입력하세요.' },
                })}
                className='w-full px-3 py-2 rounded bg-secondary border border-border text-foreground'
              />
              <p className='text-text-tertiary text-xs mt-1'>6자 이상</p>
              {passwordForm.formState.errors.newPassword && (
                <p className='msg-error mt-1.5'>
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>새 비밀번호 확인</label>
              <input
                type='password'
                {...passwordForm.register('newPasswordConfirm', {
                  required: '비밀번호 확인을 입력하세요.',
                  validate: (v) =>
                    v === newPassword || '비밀번호가 일치하지 않습니다.',
                })}
                className='w-full px-3 py-2 rounded bg-secondary border border-border text-foreground'
              />
              {passwordForm.formState.errors.newPasswordConfirm && (
                <p className='msg-error mt-1.5'>
                  {passwordForm.formState.errors.newPasswordConfirm.message}
                </p>
              )}
            </div>
            {passwordMutation.isError && (
              <p className='msg-error'>
                {(passwordMutation.error as any)?.message || '비밀번호 변경에 실패했습니다.'}
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

        <Link href={routes.profile.index} className='block mt-6 text-primary text-sm'>
          ← 내 정보로
        </Link>
      </div>
    </Layout>
  );
}
