/**
 * Toss billing auth success redirect.
 * Query: subscriptionId (we set), customerKey & authKey (Toss appends).
 * Calls POST /payments/billing-key then shows result.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import BackLink from '@/components/page/BackLink';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import PaymentsApi from '@/lib/api/paymentApi';
import { useQueryClient } from '@tanstack/react-query';

type Status = 'loading' | 'success' | 'error';

export default function SubscriptionCheckoutSuccessPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { subscriptionId, customerKey, authKey } = router.query;
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!router.isReady) return;

    const subId =
      typeof subscriptionId === 'string' ? subscriptionId : Array.isArray(subscriptionId) ? subscriptionId[0] : '';
    const cKey =
      typeof customerKey === 'string' ? customerKey : Array.isArray(customerKey) ? customerKey[0] : '';
    const aKey = typeof authKey === 'string' ? authKey : Array.isArray(authKey) ? authKey[0] : '';

    if (!subId || !cKey || !aKey) {
      queueMicrotask(() => {
        setStatus('error');
        setErrorMsg('결제 정보가 없습니다. 구독 플랜에서 다시 시도해 주세요.');
      });
      return;
    }

    (async () => {
      try {
        await PaymentsApi.billingKeyAndConfirm({
          subscriptionId: subId,
          customerKey: cKey,
          authKey: aKey,
        });
        queryClient.invalidateQueries({ queryKey: ['subscription', 'status'] });
        queryClient.invalidateQueries({ queryKey: ['subscription', 'history'] });
        setStatus('success');
      } catch (err: unknown) {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : '결제 확인에 실패했습니다.');
      }
    })();
  }, [router.isReady, subscriptionId, customerKey, authKey, queryClient]);

  if (status === 'loading') {
    return (
      <Layout title='구독 결제 확인 — OddsCast'>
        <div className='max-w-md mx-auto'>
          <CompactPageTitle title='결제 확인' backHref={routes.mypage.subscriptions} />
          <div className='flex flex-col items-center justify-center py-16'>
            <LoadingSpinner size={32} label='결제를 확인하고 있습니다...' />
          </div>
        </div>
      </Layout>
    );
  }

  if (status === 'error') {
    return (
      <Layout title='구독 결제 실패 — OddsCast'>
        <div className='max-w-md mx-auto'>
          <CompactPageTitle title='결제 실패' backHref={routes.mypage.subscriptions} />
          <EmptyState icon='AlertCircle' title='결제 확인 실패' description={errorMsg} />
          <Link href={routes.mypage.subscriptions} className='btn-primary block text-center mt-4'>
            구독 플랜으로
          </Link>
          <BackLink href={routes.mypage.subscriptions} label='구독 플랜으로' className='mt-4 block' />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title='구독 완료 — OddsCast'>
      <div className='max-w-md mx-auto text-center'>
        <CompactPageTitle title='구독 완료' backHref={routes.mypage.subscriptions} />
        <div className='rounded-xl border border-border bg-card p-6 mb-6'>
          <Icon name='CheckCircle' size={48} className='text-primary mx-auto mb-3' />
          <h2 className='text-lg font-bold text-foreground mb-2'>구독이 완료되었습니다</h2>
          <p className='text-text-secondary text-sm'>
            매월 예측권이 자동으로 발급됩니다. AI 예측을 이용해 보세요.
          </p>
        </div>
        <Link href={routes.profile.index} className='btn-primary block'>
          내 정보로
        </Link>
        <Link
          href={routes.mypage.subscriptions}
          className='block mt-3 text-text-secondary text-sm hover:underline'
        >
          구독 관리
        </Link>
        <BackLink href={routes.profile.index} label='정보로' className='mt-4 block' />
      </div>
    </Layout>
  );
}
