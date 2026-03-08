import { useState } from 'react';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { adminSubscriptionsApi } from '@/lib/api/admin';
import { formatCurrency, getErrorMessage } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────

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
  matrixTickets: number;
  isActive: boolean;
  sortOrder: number;
}

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
  matrixTickets: z.number().int().min(0),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});

type PlanFormData = z.infer<typeof planSchema>;

type CreatePlanForm = {
  planName: string;
  displayName: string;
  description: string;
  originalPrice: number;
  baseTickets: number;
  bonusTickets: number;
};

// ─── Main Page ─────────────────────────────────────────────

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);

  // ─── Queries ─────────────────────────────────────────────

  const { data: plans, isLoading, error: plansError, refetch: refetchPlans } = useQuery({
    queryKey: ['admin-subscription-plans'],
    queryFn: () => adminSubscriptionsApi.getPlans(),
  });

  // ─── Create form ─────────────────────────────────────────

  const createForm = useForm<CreatePlanForm>({
    defaultValues: { planName: '', displayName: '', description: '', originalPrice: 9000, baseTickets: 5, bonusTickets: 0 },
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
      createForm.reset();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  // ─── Edit form ───────────────────────────────────────────

  const editForm = useForm<PlanFormData>({ resolver: zodResolver(planSchema) });
  const watchedOriginalPrice = editForm.watch('originalPrice');
  const watchedBaseTickets = editForm.watch('baseTickets');
  const watchedBonusTickets = editForm.watch('bonusTickets');

  const handleEditClick = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    editForm.reset(plan);
  };

  const handleOriginalPriceChange = (value: number) => {
    const vat = Math.round(value * 0.1);
    editForm.setValue('vat', vat);
    editForm.setValue('totalPrice', value + vat);
  };

  const handleTicketsChange = (base: number, bonus: number) => {
    editForm.setValue('totalTickets', base + bonus);
  };

  const updatePlanMutation = useMutation({
    mutationFn: (plan: PlanFormData) => adminSubscriptionsApi.updatePlan(String(plan.id), plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] });
      toast.success('저장되었습니다');
      setEditingPlan(null);
      editForm.reset();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  // ─── Toggle / Delete ────────────────────────────────────

  const toggleActiveMutation = useMutation({
    mutationFn: (plan: { id: string | number; isActive: boolean }) =>
      adminSubscriptionsApi.updatePlan(String(plan.id), { isActive: !plan.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] });
      toast.success('플랜 상태가 변경되었습니다');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string | number) => adminSubscriptionsApi.deletePlan(String(id)),
    onSuccess: (result: { isActive?: boolean } | void) => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] });
      toast.success(result && 'isActive' in result && !result.isActive ? '플랜이 비활성화되었습니다' : '플랜이 삭제되었습니다');
      setDeletingPlan(null);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  // ─── Render ──────────────────────────────────────────────

  return (
    <>
      <Head>
        <title>구독 관리 | OddsCast Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader
            title='구독 관리'
            description='구독 플랜별 가격·예측권 수량을 관리합니다. 활성/비활성으로 앱 노출을 제어할 수 있습니다.'
          >
            <Button onClick={() => setShowCreateModal(true)}>플랜 추가</Button>
          </PageHeader>

          {plansError && (
            <div className='rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
              <p>구독 플랜을 불러오는 중 오류가 발생했습니다.</p>
              <Button type='button' variant='secondary' size='sm' className='mt-2' onClick={() => refetchPlans()}>다시 시도</Button>
            </div>
          )}

          {/* Plan cards */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {isLoading ? (
              <div className='col-span-3 flex justify-center py-12'>
                <LoadingSpinner size='lg' label='구독 플랜을 불러오는 중...' />
              </div>
            ) : plans && plans.length > 0 ? (
              (plans as SubscriptionPlan[]).map((plan) => (
                <Card key={plan.id}>
                  <div className='space-y-4'>
                    <div className='flex items-start justify-between'>
                      <div>
                        <h3 className='text-lg font-semibold'>{plan.displayName}</h3>
                        <p className='text-xs text-gray-400'>{plan.planName}</p>
                        <p className='text-sm text-gray-500 mt-1'>{plan.description}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        {plan.isActive ? '활성' : '비활성'}
                      </span>
                    </div>

                    <div className='border-t pt-4'>
                      <div className='text-lg font-bold'>{formatCurrency(plan.totalPrice)}</div>
                      <div className='text-sm text-gray-500 mt-1'>
                        경주 예측권 {plan.totalTickets}장/월
                        {(plan.matrixTickets ?? 0) > 0 && (
                          <span className='ml-1.5 text-purple-600 font-medium'>+ 종합 {plan.matrixTickets}장</span>
                        )}
                      </div>
                    </div>

                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>원가</span>
                        <span>₩{plan.originalPrice.toLocaleString()}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>부가세</span>
                        <span>₩{plan.vat.toLocaleString()}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>기본 / 보너스</span>
                        <span>{plan.baseTickets}장 + {plan.bonusTickets}장</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>장당 가격</span>
                        <span className='font-medium'>{formatCurrency(Math.round(plan.totalPrice / plan.totalTickets))}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>할인율</span>
                        <span className='font-medium text-green-600'>
                          {Math.round(((plan.totalTickets * 550 - plan.totalPrice) / (plan.totalTickets * 550)) * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className='border-t pt-4 flex gap-2'>
                      <Button size='sm' variant='ghost' className='flex-1' onClick={() => handleEditClick(plan)}>수정</Button>
                      <Button size='sm' variant='ghost' className='flex-1' onClick={() => toggleActiveMutation.mutate(plan)} disabled={toggleActiveMutation.isPending}>
                        {plan.isActive ? '비활성화' : '활성화'}
                      </Button>
                      {!plan.isActive && (
                        <Button size='sm' variant='danger' onClick={() => setDeletingPlan(plan)}>삭제</Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className='col-span-3 text-center py-12 text-gray-500'>구독 플랜이 없습니다.</div>
            )}
          </div>
        </div>

        {/* ─── Create modal ──────────────────────────────── */}
        {showCreateModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg p-8 max-w-md w-full'>
              <h2 className='text-lg font-bold mb-4'>플랜 추가</h2>
              <form onSubmit={createForm.handleSubmit((d) => createPlanMutation.mutate(d))} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>플랜 코드</label>
                  <input {...createForm.register('planName', { required: '필수' })} placeholder='CUSTOM' className='w-full px-4 py-2 border rounded-lg' />
                  {createForm.formState.errors.planName && <p className='text-red-500 text-sm mt-1'>{createForm.formState.errors.planName.message}</p>}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>표시명</label>
                  <input {...createForm.register('displayName', { required: '필수' })} placeholder='커스텀' className='w-full px-4 py-2 border rounded-lg' />
                  {createForm.formState.errors.displayName && <p className='text-red-500 text-sm mt-1'>{createForm.formState.errors.displayName.message}</p>}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>설명</label>
                  <input {...createForm.register('description')} className='w-full px-4 py-2 border rounded-lg' />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>원가 (VAT 제외)</label>
                  <input type='number' {...createForm.register('originalPrice', { valueAsNumber: true, required: '필수', min: { value: 1, message: '1 이상' } })} className='w-full px-4 py-2 border rounded-lg' />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>기본 티켓</label>
                    <input type='number' {...createForm.register('baseTickets', { valueAsNumber: true, required: '필수', min: { value: 1, message: '1 이상' } })} className='w-full px-4 py-2 border rounded-lg' />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>보너스 티켓</label>
                    <input type='number' {...createForm.register('bonusTickets', { valueAsNumber: true, min: { value: 0, message: '0 이상' } })} className='w-full px-4 py-2 border rounded-lg' />
                  </div>
                </div>
                <div className='flex gap-2 pt-4'>
                  <Button type='submit' variant='primary' disabled={createPlanMutation.isPending} isLoading={createPlanMutation.isPending}>추가</Button>
                  <Button type='button' variant='secondary' onClick={() => setShowCreateModal(false)}>취소</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── Edit modal ────────────────────────────────── */}
        {editingPlan && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto'>
              <h2 className='text-lg font-bold mb-4'>{editingPlan.displayName} 수정</h2>
              <form onSubmit={editForm.handleSubmit((d) => updatePlanMutation.mutate(d))} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>원가 (VAT 제외)</label>
                  <input type='number' {...editForm.register('originalPrice', { valueAsNumber: true, onChange: (e) => handleOriginalPriceChange(parseFloat(e.target.value)) })} className='w-full px-4 py-2 border rounded-lg' />
                  {editForm.formState.errors.originalPrice && <p className='text-red-500 text-sm mt-1'>{editForm.formState.errors.originalPrice.message}</p>}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>부가세 (10%)</label>
                  <input type='number' {...editForm.register('vat', { valueAsNumber: true })} disabled className='w-full px-4 py-2 border rounded-lg bg-gray-100' />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>최종 가격 (VAT 포함)</label>
                  <input type='number' {...editForm.register('totalPrice', { valueAsNumber: true })} disabled className='w-full px-4 py-2 border rounded-lg bg-gray-100 font-bold text-lg' />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>기본 예측권</label>
                    <input type='number' {...editForm.register('baseTickets', { valueAsNumber: true, onChange: (e) => handleTicketsChange(parseInt(e.target.value), watchedBonusTickets || 0) })} className='w-full px-4 py-2 border rounded-lg' />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>보너스 예측권</label>
                    <input type='number' {...editForm.register('bonusTickets', { valueAsNumber: true, onChange: (e) => handleTicketsChange(watchedBaseTickets || 0, parseInt(e.target.value)) })} className='w-full px-4 py-2 border rounded-lg' />
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>총 예측권</label>
                  <input type='number' {...editForm.register('totalTickets', { valueAsNumber: true })} disabled className='w-full px-4 py-2 border rounded-lg bg-gray-100 font-bold' />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>종합 예측권 (MATRIX)</label>
                  <input type='number' {...editForm.register('matrixTickets', { valueAsNumber: true })} min={0} className='w-full px-4 py-2 border rounded-lg' />
                  <p className='text-xs text-gray-500 mt-1'>구독 시 지급되는 종합 예측권 수 (0이면 미지급)</p>
                </div>
                <div className='bg-blue-50 p-4 rounded-lg'>
                  <div className='flex justify-between mb-2'>
                    <span>장당 가격:</span>
                    <span className='font-bold'>
                      ₩{watchedOriginalPrice && watchedBaseTickets
                        ? Math.round((watchedOriginalPrice + Math.round(watchedOriginalPrice * 0.1)) / (watchedBaseTickets + (watchedBonusTickets || 0))).toLocaleString()
                        : '0'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>개별 구매 대비 할인:</span>
                    <span className='font-bold text-green-600'>
                      {watchedOriginalPrice && watchedBaseTickets
                        ? Math.round((((watchedBaseTickets + (watchedBonusTickets || 0)) * 550 - (watchedOriginalPrice + Math.round(watchedOriginalPrice * 0.1))) / ((watchedBaseTickets + (watchedBonusTickets || 0)) * 550)) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
                <div className='flex gap-4 mt-8'>
                  <Button type='submit' variant='primary' className='flex-1' disabled={updatePlanMutation.isPending || !editForm.formState.isDirty} isLoading={updatePlanMutation.isPending}>저장</Button>
                  <Button type='button' variant='secondary' className='flex-1' onClick={() => { setEditingPlan(null); editForm.reset(); }}>취소</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── Delete confirm modal ──────────────────────── */}
        {deletingPlan && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg p-6 max-w-sm w-full'>
              <h2 className='text-lg font-bold mb-2'>플랜 삭제</h2>
              <p className='text-gray-600 mb-4'>{deletingPlan.displayName}({deletingPlan.planName})를 삭제하시겠습니까?</p>
              <div className='flex gap-2'>
                <Button variant='danger' className='flex-1' onClick={() => deletePlanMutation.mutate(deletingPlan.id)} disabled={deletePlanMutation.isPending} isLoading={deletePlanMutation.isPending}>확인</Button>
                <Button variant='secondary' className='flex-1' onClick={() => setDeletingPlan(null)}>취소</Button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
