import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import BackLink from '@/components/page/BackLink';
import SectionCard from '@/components/page/SectionCard';
import Icon from '@/components/icons';
import RequireLogin from '@/components/page/RequireLogin';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/lib/store/authStore';
import PredictionTicketsApi from '@/lib/api/predictionTicketApi';
import { getErrorMessage } from '@/lib/utils/error';
import Link from 'next/link';

const PRICE_PER_TICKET = 1000;

export default function MatrixTicketPurchasePage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const queryClient = useQueryClient();
  const [count, setCount] = useState(1);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const {
    data: balance,
    isLoading: balanceLoading,
    isError: balanceError,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ['matrix-ticket-balance'],
    queryFn: () => PredictionTicketsApi.getMatrixBalance(),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const purchaseMutation = useMutation({
    mutationFn: (qty: number) => PredictionTicketsApi.purchaseMatrixTickets(qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-ticket-balance'] });
      setPurchaseSuccess(true);
      setTimeout(() => setPurchaseSuccess(false), 4000);
    },
  });

  const totalPrice = count * PRICE_PER_TICKET;

  return (
    <Layout title='종합 예측권 구매 — OddsCast'>
      <CompactPageTitle title='종합 예측권 구매' backHref={routes.predictions.matrix} />

      {!isLoggedIn ? (
        <RequireLogin />
      ) : (
        <div className='space-y-4 pb-8'>
          {/* Product information */}
          <SectionCard accent>
            <div className='flex items-start gap-3'>
              <div className='w-10 h-10 rounded bg-[rgba(22,163,74,0.1)] flex items-center justify-center shrink-0'>
                <Icon name='BarChart2' size={20} className='text-primary' />
              </div>
              <div>
                <h3 className='text-foreground font-bold text-base'>종합 예측권</h3>
                <p className='text-stone-500 text-sm mt-1'>
                  하루의 모든 경주 AI 예상을 한눈에 볼 수 있는 일일 종합 가이드 열람권입니다.
                </p>
              </div>
            </div>

            <div className='mt-4 grid grid-cols-3 gap-2'>
              <div className='bg-stone-50 rounded p-2.5 text-center'>
                <p className='text-stone-400 text-[11px]'>가격</p>
                <p className='text-foreground font-bold text-sm'>1,000원/장</p>
              </div>
              <div className='bg-stone-50 rounded p-2.5 text-center'>
                <p className='text-stone-400 text-[11px]'>유효기간</p>
                <p className='text-foreground font-bold text-sm'>30일</p>
              </div>
              <div className='bg-stone-50 rounded p-2.5 text-center'>
                <p className='text-stone-400 text-[11px]'>사용 방식</p>
                <p className='text-foreground font-bold text-sm'>1일 1장</p>
              </div>
            </div>
          </SectionCard>

          {/* Current holdings */}
          <SectionCard title='보유 현황' icon='Ticket'>
            {balanceLoading ? (
              <p className='text-stone-400 text-sm'>준비 중...</p>
            ) : balanceError ? (
              <div className='flex flex-col gap-2'>
                <p className='text-red-600 text-sm'>보유 현황을 불러올 수 없습니다.</p>
                <button
                  type='button'
                  onClick={() => refetchBalance()}
                  className='btn-secondary text-sm w-fit'
                >
                  다시 시도
                </button>
              </div>
            ) : (
              <div className='flex items-center gap-4'>
                <div>
                  <span className='text-stone-500 text-xs'>사용 가능</span>
                  <p className='text-foreground font-bold text-lg'>{balance?.available ?? 0}<span className='text-sm font-normal text-stone-400'>장</span></p>
                </div>
                <div className='w-px h-8 bg-stone-200' />
                <div>
                  <span className='text-stone-500 text-xs'>사용 완료</span>
                  <p className='text-stone-500 font-medium text-lg'>{balance?.used ?? 0}<span className='text-sm font-normal text-stone-400'>장</span></p>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Purchase quantity selection */}
          <SectionCard title='구매 수량' icon='ShoppingCart'>
            <div className='flex items-center gap-3'>
              <button
                type='button'
                onClick={() => setCount((c) => Math.max(1, c - 1))}
                disabled={count <= 1}
                className='w-9 h-9 rounded border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
              >
                <Icon name='Minus' size={16} />
              </button>
              <span className='text-foreground font-bold text-xl min-w-[2.5rem] text-center'>{count}</span>
              <button
                type='button'
                onClick={() => setCount((c) => Math.min(10, c + 1))}
                disabled={count >= 10}
                className='w-9 h-9 rounded border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
              >
                <Icon name='Plus' size={16} />
              </button>
              <span className='text-stone-400 text-xs ml-1'>최대 10장</span>
            </div>

            <div className='mt-4 flex items-center justify-between py-3 border-t border-stone-100'>
              <span className='text-stone-500 text-sm'>결제 금액</span>
              <span className='text-foreground font-bold text-lg'>{totalPrice.toLocaleString()}원</span>
            </div>
          </SectionCard>

          {/* Purchase button */}
          <button
            type='button'
            onClick={() => purchaseMutation.mutate(count)}
            disabled={purchaseMutation.isPending}
            className='btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2'
          >
            <Icon name='CreditCard' size={16} />
            {purchaseMutation.isPending
              ? '결제 처리 중...'
              : `종합 예측권 ${count}장 구매 — ${totalPrice.toLocaleString()}원`}
          </button>

          {/* Success message */}
          {purchaseSuccess && (
            <div className='msg-success text-sm flex items-center gap-2'>
              <Icon name='CheckCircle' size={16} />
              종합 예측권 구매가 완료되었습니다.
            </div>
          )}

          {/* Error message */}
          {purchaseMutation.error && (
            <div className='msg-error text-sm'>
              {getErrorMessage(purchaseMutation.error)}
            </div>
          )}

          {/* Notice */}
          <div className='bg-stone-50 rounded p-3 text-xs text-stone-500 space-y-1'>
            <p className='font-medium text-stone-600'>이용 안내</p>
            <p>• 종합 예측권 1장으로 해당 날짜의 전체 경주 AI 예상표를 열람할 수 있습니다.</p>
            <p>• 같은 날짜에 이미 사용한 예측권이 있으면 추가 차감되지 않습니다.</p>
            <p>• 구매 후 30일 내에 사용하지 않으면 만료됩니다.</p>
            <p>• 구독 플랜(스탠다드 이상)에는 종합 예측권이 포함되어 있습니다.</p>
          </div>

          {/* Go to matrix */}
          <Link
            href={routes.predictions.matrix}
            className='block text-center text-sm text-primary hover:underline'
          >
            종합 예상표 바로가기 →
          </Link>
          <BackLink href={routes.profile.index} label='정보로' className='mt-6 block' />
        </div>
      )}
    </Layout>
  );
}
