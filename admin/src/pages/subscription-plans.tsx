import { useState } from 'react';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import PageLoading from '@/components/common/PageLoading';
import { adminSubscriptionsApi } from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/utils';

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
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);

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
  const { data: plans, isLoading, error: plansError, refetch: refetchPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => adminSubscriptionsApi.getPlans(),
  });

  // watch로 실시간 값 추적
  const watchedOriginalPrice = watch('originalPrice');
  const watchedBaseTickets = watch('baseTickets');
  const watchedBonusTickets = watch('bonusTickets');

  // 플랜 수정 mutation
  const updatePlanMutation = useMutation({
    mutationFn: (plan: PlanFormData) => adminSubscriptionsApi.updatePlan(String(plan.id), plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('저장되었습니다');
      setEditingPlan(null);
      reset();
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err) || '저장에 실패했습니다. 다시 시도해주세요.');
    },
  });

  // 플랜 삭제/비활성화 mutation
  const deletePlanMutation = useMutation({
    mutationFn: (id: string | number) => adminSubscriptionsApi.deletePlan(String(id)),
    onSuccess: (result: { isActive?: boolean } | void) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success(result && 'isActive' in result && !result.isActive ? '플랜이 비활성화되었습니다' : '플랜이 삭제되었습니다');
      setDeletingPlan(null);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err) || '삭제에 실패했습니다');
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
          <title>구독 플랜 관리 | OddsCast Admin</title>
        </Head>
        <Layout>
          <PageLoading label='구독 플랜을 불러오는 중...' />
        </Layout>
      </>
    );
  }

  if (plansError) {
    return (
      <>
        <Head>
          <title>구독 플랜 관리 | OddsCast Admin</title>
        </Head>
        <Layout>
          <div className='rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-center'>
            <p className='text-amber-800 font-medium'>구독 플랜을 불러오는 중 오류가 발생했습니다.</p>
            <button
              type='button'
              onClick={() => refetchPlans()}
              className='mt-4 inline-flex items-center rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-800 shadow-sm hover:bg-amber-50'
            >
              다시 시도
            </button>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>구독 플랜 관리 | OddsCast Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader title='구독 플랜 관리' />

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {plans &&
              plans.map((plan) => (
                <div key={plan.id} className='bg-white rounded-md shadow p-4'>
                  <div className='flex justify-between items-start mb-4'>
                    <div>
                      <h2 className='text-lg font-bold text-gray-900'>{plan.displayName}</h2>
                      <p className='text-sm text-gray-500'>{plan.planName}</p>
                    </div>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => handleEditClick(plan)}
                        className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
                      >
                        수정
                      </button>
                      <button
                        onClick={() => setDeletingPlan(plan)}
                        className='px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200'
                      >
                        {plan.isActive ? '비활성화' : '삭제'}
                      </button>
                    </div>
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
                          ((plan.totalTickets * 550 - plan.totalPrice) /
                            (plan.totalTickets * 550)) *
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
                              (((watchedBaseTickets + watchedBonusTickets) * 550 -
                                (watchedOriginalPrice + Math.round(watchedOriginalPrice * 0.1))) /
                                ((watchedBaseTickets + watchedBonusTickets) * 550)) *
                                100
                            )
                          : editingPlan
                          ? Math.round(
                              ((editingPlan.totalTickets * 550 - editingPlan.totalPrice) /
                                (editingPlan.totalTickets * 550)) *
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

          {deletingPlan && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
              <div className='bg-white rounded-lg p-6 max-w-sm w-full'>
                <h2 className='text-lg font-bold mb-2'>플랜 삭제</h2>
                <p className='text-gray-600 mb-4'>
                  {deletingPlan.displayName}({deletingPlan.planName})를
                  {deletingPlan.isActive ? ' 비활성화' : ' 삭제'}하시겠습니까?
                </p>
                <div className='flex gap-2'>
                  <button
                    onClick={() => deletePlanMutation.mutate(deletingPlan.id)}
                    disabled={deletePlanMutation.isPending}
                    className='flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50'
                  >
                    {deletePlanMutation.isPending ? '처리 중...' : '확인'}
                  </button>
                  <button
                    onClick={() => setDeletingPlan(null)}
                    className='flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300'
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
