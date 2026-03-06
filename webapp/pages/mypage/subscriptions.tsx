import React from 'react';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import BackLink from '@/components/page/BackLink';
import DataFetchState from '@/components/page/DataFetchState';
import Link from 'next/link';
import SectionCard from '@/components/page/SectionCard';
import { routes } from '@/lib/routes';
import SubscriptionPlansApi from '@/lib/api/subscriptionPlansApi';
import type { SubscriptionPlan } from '@/lib/api/subscriptionPlansApi';
import SubscriptionApi from '@/lib/api/subscriptionApi';
import type { SubscriptionHistoryItem } from '@/lib/api/subscriptionApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import Icon from '@/components/icons';

export default function SubscriptionsPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = React.useState(false);

  const { data: plans, isLoading, error: plansError, refetch: refetchPlans } = useQuery({
    queryKey: ['subscriptions', 'plans'],
    queryFn: () => SubscriptionPlansApi.getSubscriptionPlans(),
    placeholderData: keepPreviousData,
  });

  const { data: status } = useQuery({
    queryKey: ['subscription', 'status'],
    queryFn: () => SubscriptionApi.getStatus(),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const { data: history } = useQuery({
    queryKey: ['subscription', 'history'],
    queryFn: () => SubscriptionApi.getHistory(10, 0),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const cancelMutation = useMutation({
    mutationFn: () => SubscriptionApi.cancel(),
    onSuccess: () => {
      setConfirmCancel(false);
      queryClient.invalidateQueries({ queryKey: ['subscription', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'history'] });
    },
  });

  return (
    <Layout title='구독 플랜 | OddsCast'>
      <CompactPageTitle title='구독 플랜' backHref={routes.profile.index} />
        {!isLoggedIn && (
          <p className='text-text-secondary text-sm mb-6'>
            <Link href={routes.auth.login} className='link-primary'>로그인</Link> 후 구독할 수 있습니다.
          </p>
        )}

        {isLoggedIn && Array.isArray(history?.subscriptions) && history.subscriptions.length > 0 && (
          <SectionCard title='구독 이력' icon='Crown' className='mb-6'>
            <div className='space-y-2 max-h-40 overflow-y-auto'>
              {history.subscriptions.slice(0, 5).map((h: SubscriptionHistoryItem) => (
                <div
                  key={h.id}
                  className='flex items-center justify-between py-2 border-b border-border last:border-0 text-sm'
                >
                  <span className='text-foreground'>
                    {h.plan?.displayName ?? h.plan?.planName ?? h.planId}
                  </span>
                  <span
                    className={
                      h.status === 'ACTIVE'
                        ? 'text-stone-700 font-medium'
                        : h.status === 'CANCELLED'
                          ? 'text-text-tertiary'
                          : 'text-text-secondary'
                    }
                  >
                    {h.status === 'ACTIVE' ? '활성' : h.status === 'CANCELLED' ? '취소' : h.status}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {status?.isActive && (
          <SectionCard title='현재 구독' accent className='mb-6'>
            <p className='msg-success font-medium'>
              {status.planId} · 월 {status.monthlyTickets}장
            </p>
            {status.daysUntilRenewal != null && (
              <p className={`text-sm mt-1 font-medium ${status.daysUntilRenewal <= 3 ? 'text-warning' : 'text-text-secondary'}`}>
                {status.daysUntilRenewal <= 3 && (
                  <Icon name='AlertCircle' size={13} className='inline mr-1 mb-0.5' />
                )}
                {status.daysUntilRenewal}일 후 갱신
              </p>
            )}
            {!confirmCancel ? (
              <button
                onClick={() => setConfirmCancel(true)}
                disabled={cancelMutation.isPending}
                className='btn-secondary mt-3 text-sm px-3 py-1.5'
              >
                구독 취소
              </button>
            ) : (
              <div className='mt-3 p-3 rounded-lg bg-stone-50 border border-stone-200'>
                <p className='text-sm text-foreground font-medium mb-2'>
                  구독을 취소하시겠습니까?
                </p>
                <p className='text-text-secondary text-sm mb-3'>
                  취소 후에도 현재 기간 만료일까지 이용 가능합니다.
                </p>
                <div className='flex gap-2'>
                  <button
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    className='btn-secondary text-sm px-3 py-1.5 text-error border-error/40 hover:bg-error/5'
                  >
                    {cancelMutation.isPending ? '처리 중...' : '네, 취소합니다'}
                  </button>
                  <button
                    onClick={() => setConfirmCancel(false)}
                    disabled={cancelMutation.isPending}
                    className='btn-secondary text-sm px-3 py-1.5'
                  >
                    아니요
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        )}

        <DataFetchState
          isLoading={isLoading}
          error={plansError}
          onRetry={() => refetchPlans()}
          isEmpty={!plans?.length}
          emptyIcon='Crown'
          emptyTitle='구독 플랜이 없습니다'
          emptyDescription='현재 제공 중인 구독 플랜이 없습니다.'
          loadingLabel='구독 플랜 준비 중...'
          errorTitle='구독 플랜을 확인할 수 없습니다'
        >
          <div className='space-y-4'>
            {(plans ?? []).map((plan: SubscriptionPlan) => (
              <SectionCard key={plan.id}>
                <div className='flex justify-between items-start gap-2'>
                  <div>
                    <h3 className='text-foreground font-semibold'>{plan.displayName ?? plan.planName}</h3>
                    <p className='text-text-secondary text-sm mt-1'>{plan.description}</p>
                    <p className='text-stone-800 font-bold mt-2'>
                      {plan.totalPrice?.toLocaleString() ?? plan.totalPrice}원/월
                    </p>
                    <p className='text-text-tertiary text-xs mt-1'>
                      예측권 {plan.totalTickets ?? plan.baseTickets}장/월
                      {plan.matrixTickets > 0 && (
                        <span className='ml-1 text-primary font-medium'>
                          + 종합 {plan.matrixTickets}장
                        </span>
                      )}
                    </p>
                  </div>
                  {isLoggedIn && !status?.isActive && (
                    <Link
                      href={routes.mypage.subscriptionsCheckout(plan.id)}
                      className='btn-primary shrink-0 flex items-center gap-1.5 no-underline text-sm px-3 py-1.5'
                    >
                      구독하기
                    </Link>
                  )}
                </div>
              </SectionCard>
            ))}
          </div>
        </DataFetchState>
        <BackLink href={routes.profile.index} label='내 정보로' className='mt-6 block' />
    </Layout>
  );
}
