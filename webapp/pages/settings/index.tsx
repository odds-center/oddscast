import Layout from '@/components/Layout';
import PageHeader from '@/components/page/PageHeader';
import MenuList from '@/components/page/MenuList';
import BackLink from '@/components/page/BackLink';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/lib/store/authStore';

export default function SettingsPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  return (
    <Layout title='설정 — GOLDEN RACE'>
      <PageHeader icon='Settings' title='설정' description='앱 설정을 관리합니다.' />

        {isLoggedIn ? (
          <MenuList
            items={[
              { href: routes.profile.edit, icon: 'User', label: '프로필 수정' },
              { href: routes.settingsNotifications, icon: 'Bell', label: '알림 설정' },
              { href: routes.legal.terms, icon: 'AlertCircle', label: '이용약관' },
              { href: routes.legal.privacy, icon: 'AlertCircle', label: '개인정보처리방침' },
            ]}
            className='mb-4'
          />
        ) : (
          <>
            <p className='text-text-secondary text-sm mb-4'>
              <Link href={routes.auth.login} className='link-primary'>
                로그인
              </Link>
              후 설정할 수 있습니다.
            </p>
            <MenuList
              items={[
                { href: routes.legal.terms, icon: 'AlertCircle', label: '이용약관' },
                { href: routes.legal.privacy, icon: 'AlertCircle', label: '개인정보처리방침' },
              ]}
              className='mb-4'
            />
          </>
        )}

        <BackLink href={routes.profile.index} label='프로필로' />
    </Layout>
  );
}
