import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import SectionCard from '@/components/page/SectionCard';
import MenuList from '@/components/page/MenuList';
import BackLink from '@/components/page/BackLink';
import RequireLogin from '@/components/page/RequireLogin';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/lib/store/authStore';

export default function SettingsPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  return (
    <Layout title='OddsCast'>
      <CompactPageTitle title='설정' backHref={routes.profile.index} />
      <SectionCard title='설정' icon='Settings' className='mb-4'>
        {isLoggedIn ? (
          <MenuList
            items={[
              { href: routes.profile.edit, icon: 'User', label: '프로필 수정' },
              { href: routes.settingsNotifications, icon: 'Bell', label: '알림 설정' },
              { href: routes.legal.terms, icon: 'AlertCircle', label: '이용약관' },
              { href: routes.legal.privacy, icon: 'AlertCircle', label: '개인정보처리방침' },
              { href: routes.legal.refund, icon: 'CreditCard', label: '환불 및 결제 정책' },
            ]}
          />
        ) : (
          <>
            <RequireLogin
              suffix='설정할 수 있습니다'
              showLoginButton={false}
              className='mb-4'
            />
            <MenuList
              items={[
                { href: routes.legal.terms, icon: 'AlertCircle', label: '이용약관' },
                { href: routes.legal.privacy, icon: 'AlertCircle', label: '개인정보처리방침' },
                { href: routes.legal.refund, icon: 'CreditCard', label: '환불 및 결제 정책' },
              ]}
            />
          </>
        )}
      </SectionCard>
      <BackLink href={routes.profile.index} label='프로필로' />
    </Layout>
  );
}
