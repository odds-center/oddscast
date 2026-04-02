import React from 'react';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import DataFetchState from '@/components/page/DataFetchState';
import Link from 'next/link';
import SectionCard from '@/components/page/SectionCard';
import { routes } from '@/lib/routes';
import SubscriptionPlansApi from '@/lib/api/subscriptionPlansApi';
import type { SubscriptionPlan } from '@/lib/api/subscriptionPlansApi';
import SubscriptionApi from '@/lib/api/subscriptionApi';
import type { SubscriptionHistoryItem } from '@/lib/api/subscriptionApi';
import PaymentsApi from '@/lib/api/paymentApi';
import type { BillingHistory } from '@/lib/api/paymentApi';
import RefundApi from '@/lib/api/refundApi';
import type { RefundRequestItem } from '@/lib/api/refundApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import Icon from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { getErrorMessage } from '@/lib/utils/error';

export default function SubscriptionsPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = React.useState(false);
  const [refundReason, setRefundReason] = React.useState('');
  const [refundError, setRefundError] = React.useState<string | null>(null);

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

  const { data: billingHistory } = useQuery({
    queryKey: ['payments', 'history'],
    queryFn: () => PaymentsApi.getHistory(),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const { data: myRefunds } = useQuery({
    queryKey: ['refunds', 'my'],
    queryFn: () => RefundApi.getMyRefunds(),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  // Most recent successful billing entry for refund eligibility
  const latestBilling: BillingHistory | null =
    billingHistory?.find((b) => b.status === 'SUCCESS') ?? null;

  // Check if there is already a pending refund request
  const pendingRefund: RefundRequestItem | null =
    (myRefunds ?? []).find(
      (r) => r.status === 'PENDING' && r.billingHistoryId === Number(latestBilling?.id),
    ) ?? null;

  const cancelMutation = useMutation({
    mutationFn: () => SubscriptionApi.cancel(),
    onSuccess: () => {
      setConfirmCancel(false);
      queryClient.invalidateQueries({ queryKey: ['subscription', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'history'] });
    },
  });

  const refundMutation = useMutation({
    mutationFn: () =>
      RefundApi.requestRefund({
        billingHistoryId: Number(latestBilling!.id),
        userReason: refundReason,
      }),
    onSuccess: () => {
      setRefundDialogOpen(false);
      setRefundReason('');
      setRefundError(null);
      queryClient.invalidateQueries({ queryKey: ['refunds', 'my'] });
    },
    onError: (err: unknown) => {
      setRefundError(getErrorMessage(err));
    },
  });

  return (
    <Layout title='구독 플랜 | OddsCast' description='OddsCast 구독 플랜을 비교하고 선택하세요.'>
      <CompactPageTitle title='구독 플랜' backHref={routes.profile.index} />
        {!isLoggedIn && (
          <p className='text-text-secondary text-sm mb-6'>
            <Link href={routes.auth.login} className='text-primary hover:underline'>로그인</Link> 후 구독할 수 있습니다.
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
            <p className='text-success font-medium'>
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
              <Button
                variant='outline'
                size='sm'
                onClick={() => setConfirmCancel(true)}
                disabled={cancelMutation.isPending}
                className='mt-3'
              >
                구독 취소
              </Button>
            ) : (
              <div className='mt-3 p-3 rounded-lg bg-stone-50 border border-stone-200'>
                <p className='text-sm text-foreground font-medium mb-2'>
                  구독을 취소하시겠습니까?
                </p>
                <p className='text-text-secondary text-sm mb-3'>
                  취소 후에도 현재 기간<br className='sm:hidden' />만료일까지 이용 가능합니다.
                </p>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                    className='text-error border-error/40 hover:bg-error/5'
                  >
                    {cancelMutation.isPending ? '처리 중...' : '네, 취소합니다'}
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setConfirmCancel(false)}
                    disabled={cancelMutation.isPending}
                  >
                    아니요
                  </Button>
                </div>
              </div>
            )}

            {/* Refund request section */}
            {latestBilling && (
              <div className='mt-4 pt-4 border-t border-border'>
                <p className='text-sm font-medium text-foreground mb-1'>환불 신청</p>
                <p className='text-xs text-text-secondary mb-3'>
                  결제일로부터 7일 이내, 미사용 티켓 비율에 따라 부분 환불이 가능합니다.
                </p>
                {pendingRefund ? (
                  <div className='flex items-center gap-2 text-sm text-text-secondary'>
                    <Icon name='Clock' size={14} className='text-warning shrink-0' />
                    <span>환불 심사 중입니다. 영업일 기준 3~5일 내 처리됩니다.</span>
                  </div>
                ) : (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setRefundError(null);
                      setRefundReason('');
                      setRefundDialogOpen(true);
                    }}
                  >
                    환불 신청
                  </Button>
                )}
              </div>
            )}
          </SectionCard>
        )}

        {/* Refund history for non-active subscriptions */}
        {isLoggedIn && !status?.isActive && (myRefunds ?? []).length > 0 && (
          <SectionCard title='환불 내역' icon='RefreshCw' className='mb-6'>
            <div className='space-y-2'>
              {(myRefunds ?? []).slice(0, 5).map((r: RefundRequestItem) => (
                <div
                  key={r.id}
                  className='flex items-center justify-between py-2 border-b border-border last:border-0 text-sm'
                >
                  <span className='text-text-secondary'>
                    {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                  <span
                    className={
                      r.status === 'APPROVED'
                        ? 'text-success font-medium'
                        : r.status === 'REJECTED'
                          ? 'text-error'
                          : 'text-warning'
                    }
                  >
                    {r.status === 'APPROVED'
                      ? `승인 (${(r.approvedAmount ?? 0).toLocaleString()}원)`
                      : r.status === 'REJECTED'
                        ? '거절'
                        : '심사 중'}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Refund request dialog */}
        <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>환불 신청</DialogTitle>
              <DialogDescription>
                {latestBilling && (
                  <>
                    결제 금액: <strong>{latestBilling.amount.toLocaleString()}원</strong>
                    <br />
                    미사용 티켓 비율에 따라 환불 금액이 계산됩니다.
                    <br />
                    결제일로부터 7일 초과 또는 티켓 전량 사용 시 환불이 불가합니다.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className='mt-2'>
              <label className='block text-sm font-medium text-foreground mb-1'>
                환불 사유 <span className='text-error'>*</span>
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={4}
                placeholder='환불 사유를 10자 이상 입력해 주세요.'
                className='w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none'
              />
              <p className='text-xs text-text-secondary mt-1'>{refundReason.length}자 (최소 10자)</p>
              {refundError && (
                <p className='text-xs text-error mt-2'>{refundError}</p>
              )}
            </div>
            <DialogFooter className='mt-2 flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setRefundDialogOpen(false)}
                disabled={refundMutation.isPending}
              >
                취소
              </Button>
              <Button
                size='sm'
                onClick={() => refundMutation.mutate()}
                disabled={refundReason.length < 10 || refundMutation.isPending}
              >
                {refundMutation.isPending ? '제출 중...' : '환불 신청'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
          <div className='space-y-3'>
            {(plans ?? []).map((plan: SubscriptionPlan) => {
              const name = (plan.planName ?? '').toUpperCase();
              const isRecommended = name === 'STANDARD';
              const isPremium = name === 'PREMIUM';
              const isCurrentPlan = status?.isActive && status.planId === plan.planName;
              const features: string[] = [
                `경주 예측권 ${plan.totalTickets ?? plan.baseTickets}장/월`,
                ...(plan.matrixTickets > 0 ? [`종합 예측권 ${plan.matrixTickets}장/월`] : []),
                plan.description ?? '',
              ].filter(Boolean);
              return (
                <div
                  key={plan.id}
                  className={[
                    'rounded-xl border p-4 relative transition-all',
                    isRecommended
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : isPremium
                        ? 'border-amber-300 bg-amber-50/60'
                        : 'border-border bg-card',
                  ].join(' ')}
                >
                  {isRecommended && (
                    <span className='absolute -top-2.5 left-4 bg-primary text-white text-xs font-semibold px-2.5 py-0.5 rounded-full'>
                      추천
                    </span>
                  )}
                  {isPremium && (
                    <span className='absolute -top-2.5 left-4 bg-amber-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full'>
                      프리미엄
                    </span>
                  )}
                  <div className='flex items-start justify-between gap-3 mb-3'>
                    <div>
                      <h3 className={['text-base font-bold', isPremium ? 'text-amber-700' : isRecommended ? 'text-primary-dark' : 'text-foreground'].join(' ')}>
                        {plan.displayName ?? plan.planName}
                      </h3>
                    </div>
                    <div className='text-right shrink-0'>
                      <p className='text-xl font-extrabold text-foreground'>
                        {(plan.totalPrice ?? 0).toLocaleString()}원
                      </p>
                      <p className='text-xs text-text-tertiary'>/ 월</p>
                    </div>
                  </div>
                  <ul className='space-y-1.5 mb-4'>
                    {features.map((f, i) => (
                      <li key={i} className='flex items-center gap-2 text-sm text-text-secondary'>
                        <Icon name='Check' size={14} className={isPremium ? 'text-amber-500 shrink-0' : 'text-primary shrink-0'} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrentPlan ? (
                    <div className='w-full text-center text-sm font-medium text-primary py-2 border border-primary/40 rounded-lg bg-primary/5'>
                      현재 구독 중
                    </div>
                  ) : isLoggedIn && !status?.isActive ? (
                    isPremium ? (
                      <Link
                        href={routes.mypage.subscriptionsCheckout(plan.id)}
                        className='no-underline w-full flex items-center justify-center text-sm font-semibold py-2.5 rounded-lg transition-colors bg-amber-500 hover:bg-amber-600 text-white'
                      >
                        구독하기
                      </Link>
                    ) : (
                      <Button
                        variant={isRecommended ? 'default' : 'outline'}
                        asChild
                        className='no-underline w-full py-2.5 rounded-lg'
                      >
                        <Link href={routes.mypage.subscriptionsCheckout(plan.id)}>
                          구독하기
                        </Link>
                      </Button>
                    )
                  ) : null}
                </div>
              );
            })}
          </div>
        </DataFetchState>
    </Layout>
  );
}
