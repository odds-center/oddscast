import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';
import SectionCard from '@/components/page/SectionCard';
import { routes } from '@/lib/routes';
import SubscriptionPlansApi from '@/lib/api/subscriptionPlansApi';
import type { SubscriptionPlan } from '@/lib/api/subscriptionPlansApi';
import SubscriptionApi from '@/lib/api/subscriptionApi';
import type { SubscriptionHistoryItem } from '@/lib/api/subscriptionApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

export default function SubscriptionsPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ['subscription', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'history'] });
    },
  });

  return (
    <Layout title='OddsCast'>
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
              <p className='text-text-secondary text-xs mt-1'>
                {status.daysUntilRenewal}일 후 갱신
              </p>
            )}
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className='btn-secondary mt-3 text-sm px-3 py-1.5'
            >
              {cancelMutation.isPending ? '처리 중...' : '구독 취소'}
            </button>
          </SectionCard>
        )}

        {isLoading ? (
          <div className='py-16'>
            <LoadingSpinner size={24} label='구독 플랜 준비 중...' />
          </div>
        ) : plansError ? (
          <EmptyState
            icon='AlertCircle'
            title='구독 플랜을 확인할 수 없습니다'
            description={(plansError as Error)?.message}
            action={
              <button onClick={() => refetchPlans()} className='btn-secondary px-3 py-1.5 text-sm'>
                다시 시도
              </button>
            }
          />
        ) : (
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
            {(!plans || plans.length === 0) && (
              <EmptyState
                icon='Crown'
                title='구독 플랜이 없습니다'
                description='현재 제공 중인 구독 플랜이 없습니다.'
              />
            )}
          </div>
        )}
    </Layout>
  );
}
