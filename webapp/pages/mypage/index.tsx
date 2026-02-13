import Layout from '@/components/Layout';
import { routes } from '@/lib/routes';
import Icon from '@/components/icons';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import PageHeader from '@/components/page/PageHeader';
import MenuList from '@/components/page/MenuList';

export default function MypageIndex() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  if (!isLoggedIn) {
    return (
      <Layout title='마이페이지 — GOLDEN RACE'>
        <PageHeader
          icon='User'
          title='마이페이지'
          description='로그인하면 내 정보, 즐겨찾기, 알림 등을 확인할 수 있습니다.'
        />
        <Link href={routes.auth.login} className='btn-primary inline-flex items-center gap-2 px-6 py-3'>
          <Icon name='LogIn' size={18} />
          로그인
        </Link>
      </Layout>
    );
  }

  return (
    <Layout title='마이페이지 — GOLDEN RACE'>
      <PageHeader icon='User' title='마이페이지' description='내 정보와 관련 메뉴를 확인하세요.' />
      <MenuList
        items={[
          { href: routes.profile.index, icon: 'User', label: '내 정보 (포인트, 예측권)' },
          { href: routes.profile.edit, icon: 'User', label: '프로필 수정' },
          { href: routes.mypage.ticketHistory, icon: 'Ticket', label: '예측권 이력' },
          { href: routes.mypage.pointTransactions, icon: 'Gem', label: '포인트 거래 내역' },
          { href: routes.mypage.picks, icon: 'Bookmark', label: '내가 고른 말' },
          { href: routes.mypage.favorites, icon: 'Heart', label: '즐겨찾기' },
          { href: routes.mypage.subscriptions, icon: 'Crown', label: '구독 플랜' },
          { href: routes.mypage.notifications, icon: 'Bell', label: '알림' },
          { href: routes.settings, icon: 'Settings', label: '설정' },
        ]}
      />
    </Layout>
  );
}
