import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/lib/store/authStore';
import MenuList from '@/components/page/MenuList';
import RequireLogin from '@/components/page/RequireLogin';

export default function MypageIndex() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  if (!isLoggedIn) {
    return (
      <Layout title='마이페이지 | OddsCast'>
        <CompactPageTitle title='마이페이지' backHref={routes.profile.index} />
        <RequireLogin suffix='내 정보, 알림 등을 확인할 수 있습니다.' />
      </Layout>
    );
  }

  return (
    <Layout title='마이페이지 | OddsCast'>
      <CompactPageTitle title='마이페이지' backHref={routes.profile.index} />
      <MenuList
        items={[
          { href: routes.profile.index, icon: 'User', label: '내 정보' },
          { href: routes.profile.edit, icon: 'Settings', label: '프로필 수정' },
          { href: routes.mypage.subscriptions, icon: 'Crown', label: '구독 플랜' },
          { href: routes.mypage.matrixTicketPurchase, icon: 'BarChart2', label: '종합 예측권 구매' },
          { href: routes.mypage.ticketHistory, icon: 'Ticket', label: '예측권 이력' },
          { href: routes.mypage.predictionHistory, icon: 'ClipboardList', label: '내가 본 예측' },
          { href: routes.mypage.pointTransactions, icon: 'Gem', label: '포인트 거래 내역' },
          { href: routes.mypage.notifications, icon: 'Bell', label: '알림' },
          { href: routes.settings, icon: 'Settings', label: '설정' },
        ]}
      />
    </Layout>
  );
}
