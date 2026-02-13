import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';
import PageHeader from '@/components/page/PageHeader';
import SectionCard from '@/components/page/SectionCard';
import BackLink from '@/components/page/BackLink';
import { routes } from '@/lib/routes';
import SubscriptionPlansApi from '@/lib/api/subscriptionPlansApi';
import SubscriptionApi from '@/lib/api/subscriptionApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function SubscriptionsPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const queryClient = useQueryClient();

  const { data: plans, isLoading, error: plansError, refetch: refetchPlans } = useQuery({
    queryKey: ['subscriptions', 'plans'],
    queryFn: () => SubscriptionPlansApi.getSubscriptionPlans(),
  });

  const { data: status } = useQuery({
    queryKey: ['subscription', 'status'],
    queryFn: () => SubscriptionApi.getStatus(),
    enabled: isLoggedIn,
  });

  const { data: history } = useQuery({
    queryKey: ['subscription', 'history'],
    queryFn: () => SubscriptionApi.getHistory(10, 0),
    enabled: isLoggedIn,
  });

  const cancelMutation = useMutation({
    mutationFn: () => SubscriptionApi.cancel(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'history'] });
    },
  });

  return (
    <Layout title='구독 — GOLDEN RACE'>
      <PageHeader
        icon='Crown'
        title='구독 플랜'
        description='구독으로 매월 예측권을 받아 AI 예측을 이용하세요.'
      />

        {!isLoggedIn && (
          <p className='text-text-secondary text-sm mb-6'>
            <Link href={routes.auth.login} className='link-primary'>로그인</Link> 후 구독할 수 있습니다.
          </p>
        )}

        {isLoggedIn && Array.isArray(history) && history.length > 0 && (
          <SectionCard title='구독 이력' icon='Crown' className='mb-6'>
            <div className='space-y-2 max-h-40 overflow-y-auto'>
              {history.slice(0, 5).map((h: any) => (
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
                        ? 'text-primary font-medium'
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
              className='btn-secondary mt-3 text-sm'
            >
              {cancelMutation.isPending ? '처리 중...' : '구독 취소'}
            </button>
          </SectionCard>
        )}

        {isLoading ? (
          <div className='py-16'>
            <LoadingSpinner size={24} label='구독 플랜을 불러오는 중...' />
          </div>
        ) : plansError ? (
          <EmptyState
            icon='AlertCircle'
            title='플랜을 불러오지 못했습니다'
            description={(plansError as Error)?.message}
            action={
              <button onClick={() => refetchPlans()} className='btn-secondary px-4 py-2 text-sm'>
                다시 시도
              </button>
            }
          />
        ) : (
          <div className='space-y-4'>
            {(plans ?? []).map((plan: any) => (
              <SectionCard key={plan.id}>
                <div className='flex justify-between items-start gap-2'>
                  <div>
                    <h3 className='text-foreground font-semibold'>{plan.displayName ?? plan.planName}</h3>
                    <p className='text-text-secondary text-sm mt-1'>{plan.description}</p>
                    <p className='text-primary font-bold mt-2'>
                      {plan.totalPrice?.toLocaleString() ?? plan.totalPrice}원/월
                    </p>
                    <p className='text-text-tertiary text-xs mt-1'>
                      예측권 {plan.totalTickets ?? plan.baseTickets}장/월
                    </p>
                  </div>
                  {isLoggedIn && !status?.isActive && (
                    <Link
                      href={routes.mypage.subscriptionsCheckout(plan.id)}
                      className='btn-primary shrink-0 flex items-center gap-2 no-underline'
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

        <BackLink href={routes.profile.index} label='내 정보로' />
    </Layout>
  );
}
