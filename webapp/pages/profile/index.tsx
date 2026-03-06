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
import ReferralsApi from '@/lib/api/referralsApi';
import { routes } from '@/lib/routes';
import PredictionTicketApi from '@/lib/api/predictionTicketApi';
import SubscriptionApi from '@/lib/api/subscriptionApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/utils/error';

export default function Profile() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const storeUser = useAuthStore((s) => s.user);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [codeCopied, setCodeCopied] = useState(false);
  const queryClient = useQueryClient();

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

  const { data: ticketPrice, isLoading: ticketPriceLoading } = useQuery({
    queryKey: ['points', 'ticket-price'],
    queryFn: () => PointApi.getTicketPrice(),
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

  const purchaseMutation = useMutation({
    mutationFn: (qty: number) => PointApi.purchaseTicket(qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['prediction-tickets'] });
    },
  });

  const { data: referralCode } = useQuery({
    queryKey: ['referrals', 'me'],
    queryFn: () => ReferralsApi.getMyCode(),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const [claimCodeInput, setClaimCodeInput] = useState('');
  const claimMutation = useMutation({
    mutationFn: (code: string) => ReferralsApi.claim(code),
    onSuccess: () => {
      setClaimCodeInput('');
      queryClient.invalidateQueries({ queryKey: ['referrals', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['prediction-tickets', 'balance'] });
    },
  });

  const handleCopyReferralCode = () => {
    if (!referralCode?.code) return;
    const doFeedback = () => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    };
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(referralCode.code).then(doFeedback);
    } else {
      prompt('아래 코드를 복사하세요', referralCode.code);
      doFeedback();
    }
  };

  const handlePurchase = () => {
    purchaseMutation.mutate(purchaseQty);
  };

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
  const perTicket = ticketPrice?.pointsPerTicket ?? 1200;
  const canPurchase = points >= perTicket * purchaseQty;

  const isLoading =
    balanceLoading || ticketPriceLoading || ticketBalanceLoading || subscriptionLoading;

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
          <div className='space-y-5'>
            {/* Greeting + Summary */}
            <div className='rounded-xl bg-white border border-stone-200 p-5'>
              <p className='text-stone-500 text-sm'>안녕하세요</p>
              <p className='text-lg font-bold text-foreground mt-1'>{displayName}님</p>
              {consecutiveDays > 0 && (
                <div className='mt-2'>
                  <p className='text-text-secondary text-sm flex items-center gap-1.5'>
                    <Icon name='TrendingUp' size={14} className='text-primary shrink-0' />
                    {consecutiveDays}일 연속 로그인
                    {consecutiveDays < 7 && <span className='text-text-tertiary ml-1'>· {7 - consecutiveDays}일 더하면 예측권 1장!</span>}
                  </p>
                  <div className='mt-2 flex gap-1'>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${i < consecutiveDays ? 'bg-primary' : 'bg-stone-200'}`}
                      />
                    ))}
                  </div>
                  <p className='text-text-tertiary text-xs mt-1'>{consecutiveDays}/7일</p>
                </div>
              )}
              <div className='grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-stone-100'>
                <div className='text-center'>
                  <p className='text-stone-500 text-sm mb-1'>예측권</p>
                  <p className='text-xl font-bold text-stone-800'>{ticketsCount}장</p>
                </div>
                <div className='text-center'>
                  <p className='text-stone-500 text-sm mb-1'>포인트</p>
                  <p className='text-xl font-bold text-stone-800'>{points.toLocaleString()}pt</p>
                </div>
                <div className='text-center'>
                  <p className='text-stone-500 text-sm mb-1'>구독</p>
                  <p className='text-base font-semibold mt-0.5'>
                    {subscription?.isActive ? (
                      <span className='text-primary'>{subscription.planId}</span>
                    ) : (
                      <span className='text-stone-400'>미구독</span>
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

            <SectionCard
              title='내 추천 코드'
              icon='UserPlus'
              description='친구가 코드를 입력하면 둘 다 예측권을 받아요 (추천인 3장, 친구 2장)'
            >
              {referralCode ? (
                <>
                  <div className='flex items-center gap-3 flex-wrap'>
                    <span className='font-mono text-xl font-bold text-foreground tracking-wider bg-muted/50 px-3 py-2 rounded-lg'>
                      {referralCode.code}
                    </span>
                    <button
                      type='button'
                      onClick={handleCopyReferralCode}
                      className={`btn-secondary inline-flex items-center gap-1.5 transition-colors ${codeCopied ? 'text-primary border-primary/40' : ''}`}
                    >
                      <Icon name={codeCopied ? 'Check' : 'ClipboardList'} size={16} />
                      {codeCopied ? '복사됨!' : '복사'}
                    </button>
                  </div>
                  <p className='text-text-secondary text-sm mt-2'>
                    사용 {referralCode.usedCount}/{referralCode.maxUses}회 (최대 10명)
                  </p>
                </>
              ) : (
                <p className='text-text-secondary text-sm'>불러오는 중...</p>
              )}
            </SectionCard>

            <SectionCard title='추천 코드 사용' icon='Ticket' description='친구에게 받은 코드를 입력하면 예측권 2장이 지급됩니다'>
              <div className='flex flex-col sm:flex-row gap-2'>
                <input
                  type='text'
                  value={claimCodeInput}
                  onChange={(e) => setClaimCodeInput(e.target.value.trim().toUpperCase())}
                  placeholder='코드 입력'
                  className='flex-1 min-w-0 rounded-lg border border-border px-3 py-2 text-foreground font-mono'
                  maxLength={12}
                />
                <button
                  type='button'
                  onClick={() => claimMutation.mutate(claimCodeInput)}
                  disabled={!claimCodeInput || claimCodeInput.length < 4 || claimMutation.isPending}
                  className='btn-primary shrink-0 inline-flex items-center justify-center gap-1.5'
                >
                  {claimMutation.isPending ? (
                    <Icon name='Loader2' size={16} className='animate-spin' />
                  ) : (
                    '사용하기'
                  )}
                </button>
              </div>
              {claimMutation.isError && (
                <p className='msg-error mt-2 text-sm'>{getErrorMessage(claimMutation.error)}</p>
              )}
              {claimMutation.isSuccess && (
                <p className='msg-success mt-2 text-sm'>예측권이 지급되었습니다.</p>
              )}
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
                { href: routes.mypage.predictionHistory, icon: 'ClipboardList', label: '내가 본 예측' },
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
