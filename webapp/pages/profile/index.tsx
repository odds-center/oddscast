import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import MenuList from '@/components/page/MenuList';
import DataFetchState from '@/components/page/DataFetchState';
import LegalFooter from '@/components/page/LegalFooter';
import RequireLogin from '@/components/page/RequireLogin';
import PointApi from '@/lib/api/pointApi';
import AuthApi from '@/lib/api/authApi';
import { routes } from '@/lib/routes';
import PredictionTicketApi from '@/lib/api/predictionTicketApi';
import SubscriptionApi from '@/lib/api/subscriptionApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

export default function Profile() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const storeUser = useAuthStore((s) => s.user);
  const { data: currentUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => AuthApi.getCurrentUser(),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });
  const userObj = (currentUser ?? storeUser) as { nickname?: string; name?: string; consecutiveLoginDays?: number } | undefined;
  const displayName =
    userObj && typeof userObj === 'object'
      ? userObj.nickname || userObj.name || '회원'
      : '회원';
  const consecutiveDays = userObj?.consecutiveLoginDays ?? 0;

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['points', 'balance'],
    queryFn: () => PointApi.getMyBalance(),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const { data: ticketBalance, isLoading: ticketBalanceLoading } = useQuery({
    queryKey: ['prediction-tickets', 'balance'],
    queryFn: () => PredictionTicketApi.getBalance(),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const { data: matrixBalance } = useQuery({
    queryKey: ['prediction-tickets', 'matrix-balance'],
    queryFn: () => PredictionTicketApi.getMatrixBalance(),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription', 'status'],
    queryFn: () => SubscriptionApi.getStatus(),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  if (!isLoggedIn) {
    return (
      <Layout title='내 정보 | OddsCast'>
        <div>
          <CompactPageTitle title='내 정보' backHref={routes.home} />
          <RequireLogin suffix='포인트, 예측권, 구독 정보를 확인할 수 있습니다.' />
          <LegalFooter />
        </div>
      </Layout>
    );
  }

  const points = balance?.currentPoints ?? 0;
  const isLoading = balanceLoading || ticketBalanceLoading || subscriptionLoading;
  const raceTicketsCount = ticketBalance?.availableTickets ?? ticketBalance?.available ?? 0;
  const matrixTicketsCount = matrixBalance?.available ?? 0;

  return (
    <Layout title='내 정보 | OddsCast'>
      <div>
        <CompactPageTitle title='내 정보' backHref={routes.home} />
        <DataFetchState
          isLoading={isLoading}
          error={null}
          loadingLabel='정보 준비 중...'
        >
          <div className='space-y-4'>
            {/* Profile summary card */}
            <div className='rounded-xl bg-white border border-stone-200 p-4'>
              <div className='flex items-center gap-3'>
                <div className='w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0'>
                  <Icon name='User' size={20} className='text-primary' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-base font-bold text-foreground truncate'>{displayName}님</p>
                  {consecutiveDays > 0 && (
                    <p className='text-xs text-text-secondary mt-0.5'>
                      {consecutiveDays}일 연속 로그인
                      {consecutiveDays < 7 && <span className='text-text-tertiary'> · {7 - consecutiveDays}일 후 예측권</span>}
                    </p>
                  )}
                </div>
                {subscription?.isActive && (
                  <span className='text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0'>
                    {subscription.planId}
                  </span>
                )}
              </div>

              {/* Consecutive login progress */}
              {consecutiveDays > 0 && (
                <div className='mt-3 flex gap-1'>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${i < consecutiveDays ? 'bg-primary' : 'bg-stone-200'}`}
                    />
                  ))}
                </div>
              )}

              {/* Stats row */}
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-0 mt-3 pt-3 border-t border-stone-100'>
                <div className='text-center py-2 border-r border-stone-100'>
                  <p className='text-xs text-stone-400 leading-tight'>개별 예측권</p>
                  <p className='text-xl font-bold text-stone-800 leading-tight mt-0.5'>{raceTicketsCount}<span className='text-sm font-medium'>장</span></p>
                </div>
                <div className='text-center py-2 sm:border-r border-stone-100'>
                  <p className='text-xs text-stone-400 leading-tight'>종합 예측권</p>
                  <p className='text-xl font-bold text-stone-800 leading-tight mt-0.5'>{matrixTicketsCount}<span className='text-sm font-medium'>장</span></p>
                </div>
                <div className='text-center py-2 border-t sm:border-t-0 border-r border-stone-100'>
                  <p className='text-xs text-stone-400 leading-tight'>포인트</p>
                  <p className='text-lg font-bold text-stone-800 leading-tight mt-0.5'>{points.toLocaleString()}<span className='text-sm font-medium'>pt</span></p>
                </div>
                <div className='text-center py-2 border-t sm:border-t-0 border-stone-100'>
                  <p className='text-xs text-stone-400 leading-tight'>구독</p>
                  <p className='text-lg font-semibold leading-tight mt-1'>
                    {subscription?.isActive ? (
                      <span className='text-primary'>{subscription.planId}</span>
                    ) : (
                      <span className='text-stone-300'>없음</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu */}
            <MenuList
              title='메뉴'
              items={[
                { href: routes.profile.edit, icon: 'User', label: '프로필 수정' },
                { href: routes.mypage.subscriptions, icon: 'Crown', label: '구독 플랜' },
                { href: routes.mypage.ticketHistory, icon: 'Ticket', label: '예측권 이력' },
                { href: routes.mypage.predictionHistory, icon: 'ClipboardList', label: '내가 본 예측' },
                { href: routes.mypage.pointTransactions, icon: 'Gem', label: '포인트 거래 내역' },
                { href: routes.mypage.matrixTicketPurchase, icon: 'CreditCard', label: '종합예측권 구매' },
{ href: routes.mypage.notifications, icon: 'Bell', label: '알림' },
                { href: routes.settings, icon: 'Settings', label: '설정' },
              ]}
            />

            <LegalFooter />
          </div>
        </DataFetchState>
      </div>
    </Layout>
  );
}
