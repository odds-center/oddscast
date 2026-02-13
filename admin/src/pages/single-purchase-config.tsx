import { useEffect } from 'react';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import { adminSinglePurchaseApi } from '@/lib/api/admin';

// Zod 스키마
const configSchema = z.object({
  id: z.string(),
  configName: z.string(),
  displayName: z.string(),
  description: z.string(),
  originalPrice: z.number().min(0),
  vat: z.number().min(0),
  totalPrice: z.number().min(0),
  isActive: z.boolean(),
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function SinglePurchaseConfigPage() {
  const queryClient = useQueryClient();

  // react-hook-form 설정
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
  });

  // 설정 조회
  const { data, isLoading } = useQuery({
    queryKey: ['single-purchase-config'],
    queryFn: () => adminSinglePurchaseApi.getConfig(),
  });

  // 데이터 로드 시 폼에 설정
  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data, reset]);

  // watch로 실시간 값 추적
  const watchedOriginalPrice = watch('originalPrice');

  // 설정 업데이트 mutation
  const updateConfigMutation = useMutation({
    mutationFn: (formData: ConfigFormData) => adminSinglePurchaseApi.updateConfig(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['single-purchase-config'] });
      toast.success('저장되었습니다');
    },
    onError: (error) => {
      console.error('저장 실패:', error);
      toast.error('저장에 실패했습니다. 다시 시도해주세요.');
    },
  });

  // 원가 변경 시 VAT, 총액 자동 계산
  const handleOriginalPriceChange = (value: number) => {
    const vat = Math.round(value * 0.1);
    const total = value + vat;
    setValue('vat', vat);
    setValue('totalPrice', total);
  };

  // 폼 제출
  const onSubmit = (formData: ConfigFormData) => {
    updateConfigMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>개별 구매 설정 | GoldenRace Admin</title>
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
        <title>개별 구매 설정 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader title='개별 구매 설정' />

          <div className='bg-white rounded-lg shadow p-8'>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>설정 이름</label>
                <input
                  type='text'
                  {...register('displayName')}
                  className='w-full px-4 py-2 border rounded-lg'
                />
                {errors.displayName && (
                  <p className='text-red-500 text-sm mt-1'>{errors.displayName.message}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>설명</label>
                <textarea
                  {...register('description')}
                  className='w-full px-4 py-2 border rounded-lg'
                  rows={3}
                />
                {errors.description && (
                  <p className='text-red-500 text-sm mt-1'>{errors.description.message}</p>
                )}
              </div>

              <div className='grid grid-cols-3 gap-4'>
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
              </div>

              <div className='bg-blue-50 p-4 rounded-md'>
                <h3 className='font-semibold text-gray-900 mb-4'>💰 가격 미리보기</h3>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span>1장 구매:</span>
                    <span className='font-bold'>
                      ₩
                      {watchedOriginalPrice
                        ? (
                            watchedOriginalPrice + Math.round(watchedOriginalPrice * 0.1)
                          ).toLocaleString()
                        : '0'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>5장 구매:</span>
                    <span className='font-bold'>
                      ₩
                      {watchedOriginalPrice
                        ? (
                            (watchedOriginalPrice + Math.round(watchedOriginalPrice * 0.1)) *
                            5
                          ).toLocaleString()
                        : '0'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>10장 구매:</span>
                    <span className='font-bold'>
                      ₩
                      {watchedOriginalPrice
                        ? (
                            (watchedOriginalPrice + Math.round(watchedOriginalPrice * 0.1)) *
                            10
                          ).toLocaleString()
                        : '0'}
                    </span>
                  </div>
                </div>
                <p className='text-sm text-gray-500 mt-4'>※ 대량 구매 할인 없음 (고정 가격)</p>
              </div>

              <div className='flex items-center'>
                <input
                  type='checkbox'
                  {...register('isActive')}
                  className='w-4 h-4 text-blue-600'
                />
                <label className='ml-2 text-sm text-gray-700'>활성화</label>
              </div>

              <div className='flex gap-4 mt-8'>
                <button
                  type='submit'
                  disabled={updateConfigMutation.isPending || !isDirty}
                  className='flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {updateConfigMutation.isPending ? '저장 중...' : '저장'}
                </button>
                <button
                  type='button'
                  onClick={() => window.history.back()}
                  className='flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold'
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}
