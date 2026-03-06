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
import ReferralsApi from '@/lib/api/referralsApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useState } from 'react';
import { getErrorMessage } from '@/lib/utils/error';

export default function Profile() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const storeUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [claimInput, setClaimInput] = useState('');
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');

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

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription', 'status'],
    queryFn: () => SubscriptionApi.getStatus(),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const { data: referral } = useQuery({
    queryKey: ['referrals', 'me'],
    queryFn: () => ReferralsApi.getMyReferral(),
    enabled: isLoggedIn,
  });

  const claimMutation = useMutation({
    mutationFn: (code: string) => ReferralsApi.claimCode(code),
    onSuccess: (data) => {
      setClaimError('');
      setClaimInput('');
      setClaimSuccess(`추천 코드 적용 완료! 예측권 ${data.ticketsGranted}장이 지급되었습니다.`);
      void queryClient.invalidateQueries({ queryKey: ['prediction-tickets', 'balance'] });
    },
    onError: (err: unknown) => {
      setClaimSuccess('');
      setClaimError(getErrorMessage(err));
    },
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
  const ticketsCount = ticketBalance?.availableTickets ?? 0;

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
              <div className='grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-stone-100'>
                <div className='text-center py-1'>
                  <p className='text-xs text-stone-400'>예측권</p>
                  <p className='text-lg font-bold text-stone-800 leading-tight mt-0.5'>{ticketsCount}<span className='text-sm font-medium'>장</span></p>
                </div>
                <div className='text-center py-1 border-x border-stone-100'>
                  <p className='text-xs text-stone-400'>포인트</p>
                  <p className='text-lg font-bold text-stone-800 leading-tight mt-0.5'>{points.toLocaleString()}<span className='text-sm font-medium'>pt</span></p>
                </div>
                <div className='text-center py-1'>
                  <p className='text-xs text-stone-400'>구독</p>
                  <p className='text-base font-semibold leading-tight mt-1'>
                    {subscription?.isActive ? (
                      <span className='text-primary'>{subscription.planId}</span>
                    ) : (
                      <span className='text-stone-300'>-</span>
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
                { href: routes.ranking, icon: 'Medal', label: '랭킹' },
                { href: routes.mypage.notifications, icon: 'Bell', label: '알림' },
                { href: routes.settings, icon: 'Settings', label: '설정' },
              ]}
            />

            {/* Referral section */}
            <div className='rounded-xl bg-white border border-stone-200 p-4 space-y-4'>
              <p className='text-sm font-semibold text-foreground'>친구 초대</p>

              {/* My code */}
              <div>
                <p className='text-xs text-text-secondary mb-1'>내 추천 코드</p>
                <div className='flex items-center gap-2'>
                  <span className='flex-1 rounded-lg bg-stone-100 px-3 py-2 text-sm font-mono font-bold tracking-widest text-foreground select-all'>
                    {referral?.code ?? '—'}
                  </span>
                  {referral?.code && (
                    <button
                      type='button'
                      className='btn-secondary text-xs px-3 py-2'
                      onClick={() => {
                        void navigator.clipboard.writeText(referral.code);
                      }}
                    >
                      복사
                    </button>
                  )}
                </div>
                {referral && (
                  <p className='text-xs text-text-tertiary mt-1'>
                    사용 {referral.usedCount} / {referral.maxUses}회 · 친구가 코드 사용 시 예측권 3장 지급
                  </p>
                )}
              </div>

              {/* Claim code */}
              {!claimSuccess && (
                <div>
                  <p className='text-xs text-text-secondary mb-1'>추천 코드 사용</p>
                  <div className='flex items-center gap-2'>
                    <input
                      type='text'
                      value={claimInput}
                      onChange={(e) => setClaimInput(e.target.value.toUpperCase())}
                      placeholder='코드 입력'
                      maxLength={20}
                      className='flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-mono uppercase outline-none focus:border-primary'
                    />
                    <button
                      type='button'
                      className='btn-primary text-xs px-3 py-2'
                      disabled={!claimInput.trim() || claimMutation.isPending}
                      onClick={() => claimMutation.mutate(claimInput.trim())}
                    >
                      {claimMutation.isPending ? '처리 중...' : '사용'}
                    </button>
                  </div>
                  {claimError && <p className='msg-error mt-1'>{claimError}</p>}
                  <p className='text-xs text-text-tertiary mt-1'>친구 코드 입력 시 예측권 2장 지급</p>
                </div>
              )}
              {claimSuccess && (
                <p className='text-sm text-success font-medium'>{claimSuccess}</p>
              )}
            </div>

            <LegalFooter />
          </div>
        </DataFetchState>
      </div>
    </Layout>
  );
}
