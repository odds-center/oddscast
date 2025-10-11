import { useState } from 'react';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { apiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface SubscriptionPlan {
  planId: string;
  name: string;
  description: string;
  price: number;
  ticketsPerMonth: number;
  pricePerTicket: number;
  discountPercentage: number;
  isActive: boolean;
  isRecommended: boolean;
}

export default function SubscriptionsPage() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-subscription-plans'],
    queryFn: async () => {
      const response = await apiClient.get<SubscriptionPlan[]>('/api/admin/subscriptions/plans');
      return response;
    },
  });

  return (
    <>
      <Head>
        <title>구독 관리 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>구독 관리</h1>
              <p className='mt-2 text-sm text-gray-600'>
                구독 플랜과 사용자 구독을 관리할 수 있습니다.
              </p>
            </div>
            <Button>플랜 추가</Button>
          </div>

          <div>
            <h2 className='text-xl font-semibold mb-4'>구독 플랜</h2>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {isLoading ? (
                <div className='col-span-3 text-center py-12'>로딩 중...</div>
              ) : plans && plans.length > 0 ? (
                plans.map((plan) => (
                  <Card key={plan.planId}>
                    <div className='space-y-4'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <h3 className='text-lg font-semibold'>{plan.name}</h3>
                          <p className='text-sm text-gray-500'>{plan.description}</p>
                        </div>
                        {plan.isRecommended && (
                          <span className='inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800'>
                            추천
                          </span>
                        )}
                      </div>

                      <div className='border-t pt-4'>
                        <div className='text-3xl font-bold'>{formatCurrency(plan.price)}</div>
                        <div className='text-sm text-gray-500 mt-1'>
                          월 {plan.ticketsPerMonth}개 예측권
                        </div>
                      </div>

                      <div className='space-y-2 text-sm'>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>장당 가격</span>
                          <span className='font-medium'>{formatCurrency(plan.pricePerTicket)}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>할인율</span>
                          <span className='font-medium text-green-600'>
                            {plan.discountPercentage}%
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
                        <Button size='sm' variant='ghost' className='flex-1'>
                          수정
                        </Button>
                        <Button size='sm' variant='ghost' className='flex-1'>
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
        </div>
      </Layout>
    </>
  );
}
