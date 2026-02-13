import { useState } from 'react';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import { adminSubscriptionsApi } from '@/lib/api/admin';

interface SubscriptionPlan {
  id: string;
  planName: string;
  displayName: string;
  description: string;
  originalPrice: number;
  vat: number;
  totalPrice: number;
  baseTickets: number;
  bonusTickets: number;
  totalTickets: number;
  isActive: boolean;
  sortOrder: number;
}

// Zod 스키마
const planSchema = z.object({
  id: z.string(),
  planName: z.string(),
  displayName: z.string(),
  description: z.string(),
  originalPrice: z.number().min(0),
  vat: z.number().min(0),
  totalPrice: z.number().min(0),
  baseTickets: z.number().int().min(1),
  bonusTickets: z.number().int().min(0),
  totalTickets: z.number().int().min(1),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});

type PlanFormData = z.infer<typeof planSchema>;

export default function SubscriptionPlansPage() {
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // react-hook-form 설정
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
  });

  // 플랜 목록 조회
  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => adminSubscriptionsApi.getPlans(),
  });

  // watch로 실시간 값 추적
  const watchedOriginalPrice = watch('originalPrice');
  const watchedBaseTickets = watch('baseTickets');
  const watchedBonusTickets = watch('bonusTickets');

  // 플랜 수정 mutation
  const updatePlanMutation = useMutation({
    mutationFn: (plan: PlanFormData) => adminSubscriptionsApi.updatePlan(plan.id, plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('저장되었습니다');
      setEditingPlan(null);
      reset();
    },
    onError: (error) => {
      console.error('저장 실패:', error);
      toast.error('저장에 실패했습니다. 다시 시도해주세요.');
    },
  });

  // 플랜 수정 모달 열기
  const handleEditClick = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    reset(plan);
  };

  // 폼 제출
  const onSubmit = (data: PlanFormData) => {
    updatePlanMutation.mutate(data);
  };

  // 원가 변경 시 VAT, 총액 자동 계산
  const handleOriginalPriceChange = (value: number) => {
    const vat = Math.round(value * 0.1);
    const total = value + vat;
    setValue('vat', vat);
    setValue('totalPrice', total);
  };

  // 티켓 수 변경 시 총 티켓 자동 계산
  const handleTicketsChange = (baseTickets: number, bonusTickets: number) => {
    setValue('totalTickets', baseTickets + bonusTickets);
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>구독 플랜 관리 | GoldenRace Admin</title>
        </Head>
        <Layout>
          <div className='p-8'>로딩 중...</div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>구독 플랜 관리 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader title='구독 플랜 관리' />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {plans &&
              plans.map((plan) => (
                <div key={plan.id} className='bg-white rounded-md shadow p-4'>
                  <div className='flex justify-between items-start mb-4'>
                    <div>
                      <h2 className='text-lg font-bold text-gray-900'>{plan.displayName}</h2>
                      <p className='text-sm text-gray-500'>{plan.planName}</p>
                    </div>
                    <button
                      onClick={() => handleEditClick(plan)}
                      className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
                    >
                      수정
                    </button>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>원가</span>
                      <span className='font-semibold'>₩{plan.originalPrice.toLocaleString()}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>부가세 (10%)</span>
                      <span className='font-semibold'>₩{plan.vat.toLocaleString()}</span>
                    </div>
                    <div className='flex justify-between border-t pt-2'>
                      <span className='text-gray-900 font-bold'>최종 가격</span>
                      <span className='text-base font-bold text-blue-600'>
                        ₩{plan.totalPrice.toLocaleString()}
                      </span>
                    </div>

                    <div className='border-t pt-3 mt-3'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>기본 예측권</span>
                        <span className='font-semibold'>{plan.baseTickets}장</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>보너스</span>
                        <span className='font-semibold text-green-600'>+{plan.bonusTickets}장</span>
                      </div>
                      <div className='flex justify-between border-t pt-2 mt-2'>
                        <span className='text-gray-900 font-bold'>총 예측권</span>
                        <span className='text-lg font-bold'>{plan.totalTickets}장</span>
                      </div>
                    </div>

                    <div className='flex justify-between border-t pt-2 mt-2'>
                      <span className='text-gray-600'>장당 가격</span>
                      <span className='font-semibold'>
                        ₩{Math.round(plan.totalPrice / plan.totalTickets).toLocaleString()}
                      </span>
                    </div>

                    <div className='flex justify-between'>
                      <span className='text-gray-600'>개별 구매 대비</span>
                      <span className='font-semibold text-green-600'>
                        {Math.round(
                          ((plan.totalTickets * 1100 - plan.totalPrice) /
                            (plan.totalTickets * 1100)) *
                            100
                        )}
                        % 할인
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* 수정 모달 */}
          {editingPlan && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
              <div className='bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto'>
                <h2 className='text-lg font-bold mb-4'>{editingPlan.displayName} 수정</h2>

                <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      원가 (VAT 제외)
                    </label>
                    <input
                      type='number'
                      {...register('originalPrice', {
                        valueAsNumber: true,
                        onChange: (e) => handleOriginalPriceChange(parseFloat(e.target.value)),
                      })}
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                    {errors.originalPrice && (
                      <p className='text-red-500 text-sm mt-1'>{errors.originalPrice.message}</p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      부가세 (10%)
                    </label>
                    <input
                      type='number'
                      {...register('vat', { valueAsNumber: true })}
                      disabled
                      className='w-full px-4 py-2 border rounded-lg bg-gray-100'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      최종 가격 (VAT 포함)
                    </label>
                    <input
                      type='number'
                      {...register('totalPrice', { valueAsNumber: true })}
                      disabled
                      className='w-full px-4 py-2 border rounded-lg bg-gray-100 font-bold text-lg'
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        기본 예측권
                      </label>
                      <input
                        type='number'
                        {...register('baseTickets', {
                          valueAsNumber: true,
                          onChange: (e) =>
                            handleTicketsChange(parseInt(e.target.value), watchedBonusTickets || 0),
                        })}
                        className='w-full px-4 py-2 border rounded-lg'
                      />
                      {errors.baseTickets && (
                        <p className='text-red-500 text-sm mt-1'>{errors.baseTickets.message}</p>
                      )}
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        보너스 예측권
                      </label>
                      <input
                        type='number'
                        {...register('bonusTickets', {
                          valueAsNumber: true,
                          onChange: (e) =>
                            handleTicketsChange(watchedBaseTickets || 0, parseInt(e.target.value)),
                        })}
                        className='w-full px-4 py-2 border rounded-lg'
                      />
                      {errors.bonusTickets && (
                        <p className='text-red-500 text-sm mt-1'>{errors.bonusTickets.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      총 예측권
                    </label>
                    <input
                      type='number'
                      {...register('totalTickets', { valueAsNumber: true })}
                      disabled
                      className='w-full px-4 py-2 border rounded-lg bg-gray-100 font-bold'
                    />
                  </div>

                  <div className='bg-blue-50 p-4 rounded-lg'>
                    <div className='flex justify-between mb-2'>
                      <span>장당 가격:</span>
                      <span className='font-bold'>
                        ₩
                        {watchedOriginalPrice && watchedBaseTickets && watchedBonusTickets
                          ? Math.round(
                              (watchedOriginalPrice + Math.round(watchedOriginalPrice * 0.1)) /
                                (watchedBaseTickets + watchedBonusTickets)
                            ).toLocaleString()
                          : editingPlan
                          ? Math.round(
                              editingPlan.totalPrice / editingPlan.totalTickets
                            ).toLocaleString()
                          : '0'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>개별 구매 대비 할인:</span>
                      <span className='font-bold text-green-600'>
                        {watchedOriginalPrice && watchedBaseTickets && watchedBonusTickets
                          ? Math.round(
                              (((watchedBaseTickets + watchedBonusTickets) * 1100 -
                                (watchedOriginalPrice + Math.round(watchedOriginalPrice * 0.1))) /
                                ((watchedBaseTickets + watchedBonusTickets) * 1100)) *
                                100
                            )
                          : editingPlan
                          ? Math.round(
                              ((editingPlan.totalTickets * 1100 - editingPlan.totalPrice) /
                                (editingPlan.totalTickets * 1100)) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>

                  <div className='flex gap-4 mt-8'>
                    <button
                      type='submit'
                      disabled={updatePlanMutation.isPending || !isDirty}
                      className='flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {updatePlanMutation.isPending ? '저장 중...' : '저장'}
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        setEditingPlan(null);
                        reset();
                      }}
                      className='flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold'
                    >
                      취소
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
