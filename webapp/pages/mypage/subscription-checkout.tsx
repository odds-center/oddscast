/**
 * 구독 결제 페이지
 * 플로우: 플랜 선택 → 구독 신청(PENDING) → 결제 처리 → 구독 활성화
 * docs/architecture/BUSINESS_LOGIC.md 3.2 구독 결제 흐름
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import PageHeader from '@/components/page/PageHeader';
import SectionCard from '@/components/page/SectionCard';
import BackLink from '@/components/page/BackLink';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import SubscriptionPlansApi from '@/lib/api/subscriptionPlansApi';
import SubscriptionApi from '@/lib/api/subscriptionApi';
import PaymentsApi from '@/lib/api/paymentApi';
import { useAuthStore } from '@/lib/store/authStore';
import CONFIG from '@/lib/config';
import type { SubscriptionPlan } from '@/lib/api/subscriptionPlansApi';

type Step = 'loading' | 'plan' | 'paying' | 'success' | 'error';

export default function SubscriptionCheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { planId } = router.query;
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [step, setStep] = useState<Step>('loading');
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 플랜 로드
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
        setErrorMsg('플랜 정보를 불러오지 못했습니다.');
      }
    })();
  }, [planId]);

  const handlePay = async () => {
    if (!plan || !isLoggedIn) return;
    setStep('paying');
    setErrorMsg('');

    try {
      // 1. 구독 신청 (PENDING)
      const sub = await SubscriptionApi.subscribe({ planId: String(plan.id) });
      const subscriptionId = (sub as { id?: string | number })?.id;
      const subId =
        typeof subscriptionId === 'number'
          ? String(subscriptionId)
          : subscriptionId ?? '';
      if (!subId) throw new Error('구독 정보를 받지 못했습니다.');

      // 2. 결제 처리
      await PaymentsApi.processSubscription({
        planId: String(plan.id),
        paymentMethod: CONFIG.useMock ? 'MOCK' : 'CARD',
      });

      // 3. 구독 활성화
      await SubscriptionApi.activate(subId, CONFIG.useMock ? 'mock-billing-key' : 'billing-key-from-pg');

      queryClient.invalidateQueries({ queryKey: ['subscription', 'status'] });
      setStep('success');
    } catch (err: any) {
      setStep('error');
      setErrorMsg(err?.message || '결제 처리에 실패했습니다.');
    }
  };

  if (!isLoggedIn) {
    return (
      <Layout title='구독 결제 — GOLDEN RACE'>
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
      <Layout title='구독 결제 — GOLDEN RACE'>
        <div className='flex justify-center py-12'>
          <LoadingSpinner size={28} label='플랜 정보를 불러오는 중...' />
        </div>
      </Layout>
    );
  }

  if (step === 'error') {
    return (
      <Layout title='구독 결제 — GOLDEN RACE'>
        <div className='max-w-md mx-auto'>
          <EmptyState icon='AlertCircle' title='오류' description={errorMsg} />
          <BackLink href={routes.mypage.subscriptions} label='구독 플랜으로' className='mt-4 block text-center' />
        </div>
      </Layout>
    );
  }

  if (step === 'success') {
    return (
      <Layout title='구독 완료 — GOLDEN RACE'>
        <div className='max-w-md mx-auto text-center'>
          <div className='card border-primary/50 mb-6'>
            <Icon name='CheckCircle' size={48} className='text-success mx-auto mb-3' />
            <h2 className='text-lg font-bold text-foreground mb-2'>구독이 완료되었습니다</h2>
            <p className='text-text-secondary text-sm'>
              매월 예측권이 자동으로 발급됩니다. AI 예측을 이용해 보세요.
            </p>
          </div>
          <Link href={routes.profile.index} className='btn-primary block'>
            내 정보로
          </Link>
          <Link href={routes.mypage.subscriptions} className='block mt-3 text-primary text-sm'>
            구독 관리
          </Link>
        </div>
      </Layout>
    );
  }

  // step === 'plan' or 'paying'
  if (!plan) return null;

  return (
    <Layout title='구독 결제 — GOLDEN RACE'>
      <div className='max-w-md mx-auto'>
        <PageHeader icon='Crown' title='구독 결제' />

        <SectionCard className='mb-6'>
          <h3 className='text-foreground font-semibold'>{plan.displayName ?? plan.planName}</h3>
          <p className='text-text-secondary text-sm mt-1'>{plan.description}</p>
          <p className='text-primary font-bold mt-2'>{plan.totalPrice?.toLocaleString()}원/월</p>
          <p className='text-text-tertiary text-xs mt-1'>예측권 {plan.totalTickets ?? plan.baseTickets}장/월</p>
        </SectionCard>

        {CONFIG.useMock && (
          <p className='text-text-secondary text-sm mb-4 p-3 rounded bg-secondary'>
            데모 모드: 테스트 결제로 진행됩니다.
          </p>
        )}

        <div className='flex gap-3'>
          <button
            onClick={handlePay}
            disabled={step === 'paying'}
            className='btn-primary flex-1 flex items-center justify-center gap-2'
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
