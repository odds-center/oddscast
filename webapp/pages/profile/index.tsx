import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import SectionCard from '@/components/page/SectionCard';
import MenuList from '@/components/page/MenuList';
import DataFetchState from '@/components/page/DataFetchState';
import RequireLogin from '@/components/page/RequireLogin';
import Dropdown from '@/components/ui/Dropdown';
import PointApi from '@/lib/api/pointApi';
import { routes } from '@/lib/routes';
import PredictionTicketApi from '@/lib/api/predictionTicketApi';
import SubscriptionApi from '@/lib/api/subscriptionApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Profile() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const _user = useAuthStore((s) => s.user);
  void _user; // store 구독 유지
  const [purchaseQty, setPurchaseQty] = useState(1);
  const queryClient = useQueryClient();

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
        <CompactPageTitle title='내 정보' backHref={routes.home} />
        <RequireLogin suffix='포인트, 예측권, 구독 정보를 확인할 수 있습니다.' />
      </Layout>
    );
  }

  const points = balance?.currentPoints ?? 0;
  const perTicket = ticketPrice?.pointsPerTicket ?? 1200;
  const canPurchase = points >= perTicket * purchaseQty;

  const isLoading =
    balanceLoading || ticketPriceLoading || ticketBalanceLoading || subscriptionLoading;

  return (
    <Layout title='GOLDEN RACE'>
      <div>
        <CompactPageTitle title='내 정보' backHref={routes.home} />
        <DataFetchState
          isLoading={isLoading}
          error={null}
          loadingLabel='정보를 불러오는 중...'
        >
          <div className='space-y-6'>
            <SectionCard title='예측권' icon='Ticket'>
              <p className='text-3xl sm:text-[2rem] font-bold text-primary tracking-tight'>
                {ticketBalance?.availableTickets ?? 0}장
              </p>
              <p className='text-text-secondary text-sm mt-2 leading-relaxed'>
                AI 예측을 보려면 예측권이 필요합니다. 포인트로 구매하거나 구독으로 받을 수 있습니다.
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

            <SectionCard title='포인트' icon='Gem'>
              <p className='text-3xl sm:text-[2rem] font-bold text-primary tracking-tight'>{points.toLocaleString()}pt</p>
              <p className='text-text-secondary text-sm mt-2 leading-relaxed'>
                프로모션, 이벤트, 구독 등으로 포인트를 받을 수 있습니다. 포인트로 예측권을 구매할 수 있습니다.
              </p>
            </SectionCard>

            <SectionCard title='포인트로 예측권 구매' icon='CreditCard'>
          <p className='text-text-secondary text-sm sm:text-[16px] mb-3 leading-relaxed'>
            1장 = {perTicket.toLocaleString()}pt (현금 구매와 별도 가격)
          </p>
          <div className='flex flex-wrap items-center gap-3'>
            <Dropdown<number>
              options={[1, 2, 3, 5, 10].map((n) => ({ value: n, label: `${n}장` }))}
              value={purchaseQty}
              onChange={setPurchaseQty}
              placeholder='수량 선택'
              className='w-[120px] shrink-0'
            />
            <span className='text-text-secondary text-sm'>
              = {(perTicket * purchaseQty).toLocaleString()}pt
            </span>
            <button
              onClick={handlePurchase}
              disabled={!canPurchase || purchaseMutation.isPending}
              className='btn-primary px-5 py-2.5 disabled:opacity-50 flex items-center gap-2 min-h-[44px]'
            >
              {purchaseMutation.isPending ? (
                <>
                  <Icon name='Loader2' size={16} className='animate-spin' />
                  처리 중...
                </>
              ) : (
                '구매'
              )}
            </button>
          </div>
          {!canPurchase && points > 0 && (
            <p className='msg-warning mt-2'>포인트가 부족합니다.</p>
          )}
          {purchaseMutation.isSuccess && (
            <p className='msg-success mt-2'>
              예측권 {purchaseMutation.data?.tickets?.length ?? 0}장 구매 완료!
            </p>
          )}
            </SectionCard>

            <MenuList
              title='메뉴'
              items={[
                { href: routes.profile.edit, icon: 'User', label: '프로필 수정' },
                { href: routes.ranking, icon: 'Medal', label: '랭킹' },
                { href: routes.mypage.subscriptions, icon: 'Crown', label: '구독 플랜' },
                { href: routes.mypage.ticketHistory, icon: 'Ticket', label: '예측권 이력' },
                { href: routes.mypage.pointTransactions, icon: 'Gem', label: '포인트 거래 내역' },
                { href: routes.mypage.notifications, icon: 'Bell', label: '알림' },
                { href: routes.settings, icon: 'Settings', label: '설정' },
              ]}
            />
          </div>
        </DataFetchState>
      </div>
    </Layout>
  );
}
