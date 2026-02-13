import { useState } from 'react';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { adminSubscriptionsApi } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils';
import type { SubscriptionPlan } from '@/lib/types/admin';

export default function SubscriptionsPage() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-subscription-plans'],
    queryFn: () => adminSubscriptionsApi.getPlans(),
  });

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
            <Button>플랜 추가</Button>
          </PageHeader>

          <div>
            <h2 className='text-base font-semibold mb-3'>구독 플랜</h2>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {isLoading ? (
                <div className='col-span-3 text-center py-12'>로딩 중...</div>
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
                              ((plan.totalTickets * 1100 - plan.totalPrice) /
                                (plan.totalTickets * 1100)) *
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
