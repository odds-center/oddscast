/**
 * Subscription checkout page
 * Flow: plan selection → subscribe (PENDING) → Toss billing auth window → redirect to success/fail → billing-key API
 * @see docs/features/SUBSCRIPTION_PG_TOSSPAYMENTS.md
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import SectionCard from '@/components/page/SectionCard';
import BackLink from '@/components/page/BackLink';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import SubscriptionPlansApi from '@/lib/api/subscriptionPlansApi';
import SubscriptionApi from '@/lib/api/subscriptionApi';
import CONFIG from '@/lib/config';
import { useAuthStore } from '@/lib/store/authStore';
import type { SubscriptionPlan } from '@/lib/api/subscriptionPlansApi';

const TOSSPAYMENTS_SCRIPT = 'https://js.tosspayments.com/v1/payment';

type Step = 'loading' | 'plan' | 'paying' | 'success' | 'error';

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      requestBillingAuth: (
        method: string,
        options: { customerKey: string; successUrl: string; failUrl: string },
      ) => Promise<void>;
    };
  }
}

export default function SubscriptionCheckoutPage() {
  const router = useRouter();
  const { planId } = router.query;
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [step, setStep] = useState<Step>('loading');
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Load plan
  useEffect(() => {
    if (!planId || typeof planId !== 'string') {
      setStep('error');
      setErrorMsg('플랜을 선택해주세요.');
      return;
    }

    (async () => {
      try {
        const plans = await SubscriptionPlansApi.getSubscriptionPlans();
        const found = plans.find(
          (p) => String(p.id) === planId || p.id === planId || p.planName === planId,
        );
        if (!found) {
          setStep('error');
          setErrorMsg('플랜을 찾을 수 없습니다.');
          return;
        }
        setPlan(found);
        setStep('plan');
      } catch {
        setStep('error');
        setErrorMsg('구독 플랜을 확인할 수 없습니다.');
      }
    })();
  }, [planId]);

  const loadTossScript = useCallback((): Promise<void> => {
    if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
    const existing = document.querySelector(`script[src="${TOSSPAYMENTS_SCRIPT}"]`);
    if (existing) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = TOSSPAYMENTS_SCRIPT;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('토스페이먼츠 스크립트를 불러오지 못했습니다.'));
      document.body.appendChild(script);
    });
  }, []);

  const handlePay = async () => {
    if (!plan || !isLoggedIn) return;

    const clientKey = CONFIG.tossPayments?.clientKey ?? '';
    if (!clientKey) {
      setStep('error');
      setErrorMsg('결제가 설정되지 않았습니다. (NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY)');
      return;
    }

    setStep('paying');
    setErrorMsg('');

    try {
      const sub = await SubscriptionApi.subscribe({ planId: String(plan.id) });
      const subId = String((sub as { id?: number })?.id ?? '');
      const customerKey = (sub as { customerKey?: string })?.customerKey ?? '';
      if (!subId || !customerKey) throw new Error('구독 정보를 받지 못했습니다.');

      await loadTossScript();

      const TossPayments = window.TossPayments;
      if (!TossPayments) throw new Error('토스페이먼츠를 불러올 수 없습니다.');

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const successUrl = `${origin}${routes.mypage.subscriptionCheckoutSuccess}?subscriptionId=${encodeURIComponent(subId)}`;
      const failUrl = `${origin}${routes.mypage.subscriptionCheckoutFail}?subscriptionId=${encodeURIComponent(subId)}`;

      const toss = TossPayments(clientKey);
      await toss.requestBillingAuth('카드', {
        customerKey,
        successUrl,
        failUrl,
      });
      setStep('plan');
    } catch (err: unknown) {
      setStep('error');
      setErrorMsg(err instanceof Error ? err.message : '결제창을 열지 못했습니다.');
    }
  };

  if (!isLoggedIn) {
    return (
      <Layout title='OddsCast'>
        <div className='max-w-md mx-auto'>
          <p className='text-text-secondary mb-6'>
            <Link href={routes.auth.login} className='link-primary'>
              로그인
            </Link>
            후 구독할 수 있습니다.
          </p>
          <BackLink href={routes.mypage.subscriptions} label='구독 플랜으로' className='mt-4 block' />
        </div>
      </Layout>
    );
  }

  if (step === 'loading') {
    return (
      <Layout title='OddsCast'>
        <div className='flex justify-center py-12'>
          <LoadingSpinner size={28} label='구독 플랜 준비 중...' />
        </div>
      </Layout>
    );
  }

  if (step === 'error') {
    return (
      <Layout title='OddsCast'>
        <div className='max-w-md mx-auto'>
          <EmptyState icon='AlertCircle' title='오류' description={errorMsg} />
          <BackLink href={routes.mypage.subscriptions} label='구독 플랜으로' className='mt-4 block text-center' />
        </div>
      </Layout>
    );
  }

  // step === 'plan' or 'paying'
  if (!plan) return null;

  return (
    <Layout title='OddsCast'>
      <div className='max-w-md mx-auto'>
        <CompactPageTitle title='구독 결제' backHref={routes.mypage.subscriptions} />
        <SectionCard className='mb-6' title='구독 플랜' icon='Crown'>
          <h3 className='text-foreground font-semibold'>{plan.displayName ?? plan.planName}</h3>
          <p className='text-text-secondary text-sm mt-1'>{plan.description}</p>
          <p className='text-stone-800 font-bold mt-2'>{plan.totalPrice?.toLocaleString()}원/월</p>
          <p className='text-text-tertiary text-xs mt-1'>예측권 {plan.totalTickets ?? plan.baseTickets}장/월</p>
        </SectionCard>

        <div className='flex gap-3'>
          <button
            onClick={handlePay}
            disabled={step === 'paying'}
            className='btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm px-4 py-2'
          >
            {step === 'paying' ? (
              <>
                <Icon name='Loader2' size={18} className='animate-spin' />
                처리 중...
              </>
            ) : (
              '결제하기'
            )}
          </button>
          <Link href={routes.mypage.subscriptions} className='btn-secondary shrink-0'>
            취소
          </Link>
        </div>

        <BackLink href={routes.mypage.subscriptions} label='구독 플랜으로' />
      </div>
    </Layout>
  );
}
