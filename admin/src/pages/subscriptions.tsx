import { useState } from 'react';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/common/Button';
import { adminSubscriptionsApi } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils';
import type { SubscriptionPlan } from '@/lib/types/admin';

type CreatePlanForm = {
  planName: string;
  displayName: string;
  description: string;
  originalPrice: number;
  baseTickets: number;
  bonusTickets: number;
};

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-subscription-plans'],
    queryFn: () => adminSubscriptionsApi.getPlans(),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreatePlanForm>({
    defaultValues: {
      planName: '',
      displayName: '',
      description: '',
      originalPrice: 9000,
      baseTickets: 5,
      bonusTickets: 0,
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (plan: { id: string | number; isActive: boolean }) =>
      adminSubscriptionsApi.updatePlan(String(plan.id), { isActive: !plan.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] });
      toast.success('플랜 상태가 변경되었습니다');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : '상태 변경에 실패했습니다';
      toast.error(msg);
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: (data: CreatePlanForm) => {
      const vat = Math.round(data.originalPrice * 0.1);
      const totalPrice = data.originalPrice + vat;
      const totalTickets = data.baseTickets + data.bonusTickets;
      return adminSubscriptionsApi.createPlan({
        planName: data.planName,
        displayName: data.displayName,
        description: data.description || undefined,
        originalPrice: data.originalPrice,
        vat,
        totalPrice,
        baseTickets: data.baseTickets,
        bonusTickets: data.bonusTickets,
        totalTickets,
        sortOrder: (plans?.length ?? 0),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] });
      toast.success('플랜이 추가되었습니다');
      setShowCreateModal(false);
      reset();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : '플랜 추가에 실패했습니다';
      toast.error(msg);
    },
  });

  const onSubmitCreate = (data: CreatePlanForm) => {
    createPlanMutation.mutate(data);
  };

  return (
    <>
      <Head>
        <title>구독 관리 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader
            title='구독 관리'
            description='구독 플랜과 사용자 구독을 관리할 수 있습니다.'
          >
            <Button onClick={() => setShowCreateModal(true)}>플랜 추가</Button>
          </PageHeader>

          <div>
            <h2 className='text-base font-semibold mb-3'>구독 플랜</h2>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {isLoading ? (
                <div className='col-span-3 flex justify-center py-12'>
                  <LoadingSpinner size='lg' label='구독 플랜을 불러오는 중...' />
                </div>
              ) : plans && plans.length > 0 ? (
                plans.map((plan) => (
                  <Card key={plan.id}>
                    <div className='space-y-4'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <h3 className='text-lg font-semibold'>{plan.displayName}</h3>
                          <p className='text-sm text-gray-500'>{plan.description}</p>
                        </div>
                        {plan.sortOrder === 2 && (
                          <span className='inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800'>
                            추천
                          </span>
                        )}
                      </div>

                      <div className='border-t pt-4'>
                        <div className='text-lg font-bold'>{formatCurrency(plan.totalPrice)}</div>
                        <div className='text-sm text-gray-500 mt-1'>
                          월 {plan.totalTickets}개 예측권
                        </div>
                      </div>

                      <div className='space-y-2 text-sm'>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>장당 가격</span>
                          <span className='font-medium'>
                            {formatCurrency(Math.round(plan.totalPrice / plan.totalTickets))}
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>할인율</span>
                          <span className='font-medium text-green-600'>
                            {Math.round(
                              ((plan.totalTickets * 550 - plan.totalPrice) /
                                (plan.totalTickets * 550)) *
                                100
                            )}
                            %
                          </span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>상태</span>
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                              plan.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {plan.isActive ? '활성' : '비활성'}
                          </span>
                        </div>
                      </div>

                      <div className='border-t pt-4 flex gap-2'>
                        <Button
                          size='sm'
                          variant='ghost'
                          className='flex-1'
                          onClick={() => (window.location.href = '/subscription-plans')}
                        >
                          수정
                        </Button>
                        <Button
                          size='sm'
                          variant='ghost'
                          className='flex-1'
                          onClick={() => toggleActiveMutation.mutate(plan)}
                          disabled={toggleActiveMutation.isPending}
                        >
                          {plan.isActive ? '비활성화' : '활성화'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className='col-span-3 text-center py-12 text-gray-500'>
                  구독 플랜이 없습니다.
                </div>
              )}
            </div>
          </div>

          {showCreateModal && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
              <div className='bg-white rounded-lg p-8 max-w-md w-full'>
                <h2 className='text-lg font-bold mb-4'>플랜 추가</h2>
                <form onSubmit={handleSubmit(onSubmitCreate)} className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>플랜 코드 (planName)</label>
                    <input
                      {...register('planName', { required: '필수' })}
                      placeholder='예: CUSTOM'
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                    {errors.planName && <p className='text-red-500 text-sm mt-1'>{errors.planName.message}</p>}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>표시명</label>
                    <input
                      {...register('displayName', { required: '필수' })}
                      placeholder='예: 커스텀'
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                    {errors.displayName && <p className='text-red-500 text-sm mt-1'>{errors.displayName.message}</p>}
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>설명</label>
                    <input {...register('description')} className='w-full px-4 py-2 border rounded-lg' />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>원가 (VAT 제외)</label>
                    <input
                      type='number'
                      {...register('originalPrice', { valueAsNumber: true, required: '필수', min: { value: 1, message: '1 이상' } })}
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                    {errors.originalPrice && <p className='text-red-500 text-sm mt-1'>{errors.originalPrice.message}</p>}
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>기본 티켓</label>
                      <input
                        type='number'
                        {...register('baseTickets', { valueAsNumber: true, required: '필수', min: { value: 1, message: '1 이상' } })}
                        className='w-full px-4 py-2 border rounded-lg'
                      />
                      {errors.baseTickets && <p className='text-red-500 text-sm mt-1'>{errors.baseTickets.message}</p>}
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>보너스 티켓</label>
                      <input
                        type='number'
                        {...register('bonusTickets', { valueAsNumber: true, min: { value: 0, message: '0 이상' } })}
                        className='w-full px-4 py-2 border rounded-lg'
                      />
                    </div>
                  </div>
                  <div className='flex gap-2 pt-4'>
                    <Button type='submit' variant='primary' disabled={createPlanMutation.isPending}>
                      {createPlanMutation.isPending ? '추가 중...' : '추가'}
                    </Button>
                    <Button type='button' variant='secondary' onClick={() => setShowCreateModal(false)}>
                      취소
                    </Button>
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
