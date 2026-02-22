import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import SectionCard from '@/components/page/SectionCard';
import MenuList from '@/components/page/MenuList';
import DataFetchState from '@/components/page/DataFetchState';
import LegalFooter from '@/components/page/LegalFooter';
import RequireLogin from '@/components/page/RequireLogin';
import Dropdown from '@/components/ui/Dropdown';
import { Tooltip } from '@/components/ui';
import PointApi from '@/lib/api/pointApi';
import AuthApi from '@/lib/api/authApi';
import { routes } from '@/lib/routes';
import PredictionTicketApi from '@/lib/api/predictionTicketApi';
import SubscriptionApi from '@/lib/api/subscriptionApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Profile() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const storeUser = useAuthStore((s) => s.user);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => AuthApi.getCurrentUser(),
    enabled: isLoggedIn,
  });
  const displayName =
    (currentUser ?? storeUser) && typeof (currentUser ?? storeUser) === 'object'
      ? ((currentUser ?? storeUser) as { nickname?: string; name?: string }).nickname ||
        ((currentUser ?? storeUser) as { nickname?: string; name?: string }).name ||
        '회원'
      : '회원';

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['points', 'balance'],
    queryFn: () => PointApi.getMyBalance(),
    enabled: isLoggedIn,
  });

  const { data: ticketPrice, isLoading: ticketPriceLoading } = useQuery({
    queryKey: ['points', 'ticket-price'],
    queryFn: () => PointApi.getTicketPrice(),
    enabled: isLoggedIn,
  });

  const { data: ticketBalance, isLoading: ticketBalanceLoading } = useQuery({
    queryKey: ['prediction-tickets', 'balance'],
    queryFn: () => PredictionTicketApi.getBalance(),
    enabled: isLoggedIn,
  });

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription', 'status'],
    queryFn: () => SubscriptionApi.getStatus(),
    enabled: isLoggedIn,
  });

  const purchaseMutation = useMutation({
    mutationFn: (qty: number) => PointApi.purchaseTicket(qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['prediction-tickets'] });
    },
  });

  const handlePurchase = () => {
    purchaseMutation.mutate(purchaseQty);
  };

  if (!isLoggedIn) {
    return (
      <Layout title='GOLDEN RACE'>
        <div>
          <CompactPageTitle title='내 정보' backHref={routes.home} />
          <RequireLogin suffix='포인트, 예측권, 구독 정보를 확인할 수 있습니다.' />
          <LegalFooter />
        </div>
      </Layout>
    );
  }

  const points = balance?.currentPoints ?? 0;
  const perTicket = ticketPrice?.pointsPerTicket ?? 1200;
  const canPurchase = points >= perTicket * purchaseQty;

  const isLoading =
    balanceLoading || ticketPriceLoading || ticketBalanceLoading || subscriptionLoading;

  const ticketsCount = ticketBalance?.availableTickets ?? 0;

  return (
    <Layout title='내 정보 | GOLDEN RACE'>
      <div>
        <CompactPageTitle title='내 정보' backHref={routes.home} />
        <DataFetchState
          isLoading={isLoading}
          error={null}
          loadingLabel='정보 준비 중...'
        >
          <div className='space-y-5'>
            {/* Greeting + Summary */}
            <div className='rounded-xl bg-white border border-stone-200 p-5'>
              <p className='text-stone-500 text-sm'>안녕하세요</p>
              <p className='text-lg font-bold text-foreground mt-1'>{displayName}님</p>
              <div className='grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-stone-100'>
                <div className='text-center'>
                  <p className='text-stone-400 text-xs mb-1'>예측권</p>
                  <p className='text-xl font-bold text-stone-800'>{ticketsCount}장</p>
                </div>
                <div className='text-center'>
                  <p className='text-stone-400 text-xs mb-1'>포인트</p>
                  <p className='text-xl font-bold text-stone-800'>{points.toLocaleString()}pt</p>
                </div>
                <div className='text-center'>
                  <p className='text-stone-400 text-xs mb-1'>구독</p>
                  <p className='text-base font-semibold mt-0.5'>
                    {subscription?.isActive ? (
                      <span className='text-primary'>{subscription.planId}</span>
                    ) : (
                      <span className='text-stone-400'>비활성</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <SectionCard title='예측권' icon='Ticket' description='경주별 AI 분석 열람 시 1장 사용'>
              <p className='text-2xl font-bold text-stone-800 tracking-tight'>{ticketsCount}장</p>
              <p className='text-text-secondary text-sm mt-2 leading-relaxed'>
                AI 마별 점수·승식 추천을 보려면 예측권이 필요합니다.
                <Tooltip content='포인트 구매 또는 구독 시 매달 자동 지급' inline> 받는 방법</Tooltip>
              </p>
            </SectionCard>

            {subscription?.isActive && (
              <SectionCard title='구독' icon='Crown' accent>
                <p className='msg-success font-medium text-[16px]'>
                  {subscription.planId} · 월 {subscription.monthlyTickets}장
                </p>
                {subscription.daysUntilRenewal != null && (
                  <p className='text-text-secondary text-sm mt-1'>
                    {subscription.daysUntilRenewal}일 후 갱신
                  </p>
                )}
              </SectionCard>
            )}

            <SectionCard title='포인트' icon='Gem' description='예측권 구매 등에 사용'>
              <p className='text-2xl font-bold text-stone-800 tracking-tight'>{points.toLocaleString()}pt</p>
              <p className='text-text-secondary text-sm mt-2 leading-relaxed'>
                이벤트·구독 등으로 적립됩니다.
                <Tooltip content='예측권 구매, 구독 시 보너스 지급' inline> 사용</Tooltip>
              </p>
            </SectionCard>

            <SectionCard title='포인트로 예측권 구매' icon='CreditCard'>
              <p className='text-text-secondary text-sm mb-3 leading-relaxed'>
                1장 = <span className='font-semibold text-stone-700'>{perTicket.toLocaleString()}pt</span>
              </p>
              <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
                <div className='flex items-center gap-3'>
                  <Dropdown<number>
                    options={[1, 2, 3, 5, 10].map((n) => ({ value: n, label: `${n}장` }))}
                    value={purchaseQty}
                    onChange={setPurchaseQty}
                    placeholder='수량 선택'
                    className='w-[120px] shrink-0'
                  />
                  <span className='text-text-secondary text-sm font-medium'>
                    = {(perTicket * purchaseQty).toLocaleString()}pt
                  </span>
                </div>
                <button
                  onClick={handlePurchase}
                  disabled={!canPurchase || purchaseMutation.isPending}
                  className='btn-primary w-full sm:w-auto disabled:opacity-50 flex items-center justify-center gap-2'
                >
                  {purchaseMutation.isPending ? (
                    <>
                      <Icon name='Loader2' size={16} className='animate-spin' />
                      처리 중...
                    </>
                  ) : (
                    '구매하기'
                  )}
                </button>
              </div>
              {!canPurchase && points > 0 && (
                <p className='msg-warning mt-3'>
                  포인트 부족 (필요 {(perTicket * purchaseQty).toLocaleString()}pt, 보유 {points.toLocaleString()}pt)
                </p>
              )}
              {purchaseMutation.isSuccess && (
                <p className='msg-success mt-3'>
                  예측권 {purchaseMutation.data?.tickets?.length ?? 0}장 구매 완료
                </p>
              )}
            </SectionCard>

            <MenuList
              title='메뉴'
              items={[
                { href: routes.profile.edit, icon: 'User', label: '프로필 수정' },
                { href: routes.mypage.subscriptions, icon: 'Crown', label: '구독 플랜' },
                { href: routes.mypage.ticketHistory, icon: 'Ticket', label: '예측권 이력' },
                { href: routes.mypage.pointTransactions, icon: 'Gem', label: '포인트 거래 내역' },
                { href: routes.mypage.matrixTicketPurchase, icon: 'CreditCard', label: '종합예측권 구매' },
                { href: routes.ranking, icon: 'Medal', label: '랭킹' },
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
