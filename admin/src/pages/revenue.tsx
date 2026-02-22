import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import { adminStatisticsApi } from '@/lib/api/admin';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Users, CreditCard, Ticket, Zap } from 'lucide-react';
import { AdminIcon } from '@/components/common/AdminIcon';
import PageLoading from '@/components/common/PageLoading';

export default function RevenuePage() {
  const [period, setPeriod] = useState('month');

  // 수익 통계 (카드 + 테이블)
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['revenue-stats', period],
    queryFn: () => adminStatisticsApi.getRevenue(period),
  });

  const revenueRows = revenueData?.rows ?? [];
  const subscriptionByPlan = revenueData?.subscriptionByPlan ?? [];
  const singlePurchaseCount = revenueData?.singlePurchaseCount ?? 0;
  const dashboard = revenueData || {
    monthlyRevenue: 0,
    singleRevenue: 0,
    totalRevenue: 0,
    monthlyCost: 0,
    monthlyProfit: 0,
    margin: 0,
    activeSubscribers: 0,
    avgRevenuePerUser: 0,
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>수익 대시보드 | OddsCast Admin</title>
        </Head>
        <Layout>
          <PageLoading label='수익 데이터를 불러오는 중...' />
        </Layout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>수익 대시보드 | OddsCast Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader
            title='수익 대시보드'
            description='구독·개별구매 매출, AI API 비용, 순이익을 일별/월별/연별로 분석합니다.'
          >
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className='px-4 py-2 border rounded-lg'
            >
              <option value='day'>일별</option>
              <option value='month'>월별</option>
              <option value='year'>연별</option>
            </select>
          </PageHeader>

          {/* 주요 지표 카드 */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='bg-gradient-to-br from-green-500 to-green-600 rounded-md shadow p-4 text-white'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <p className='text-sm opacity-90'>월 매출</p>
                  <p className='text-lg font-bold mt-1'>
                    ₩{formatNumber(dashboard?.monthlyRevenue || 0)}
                  </p>
                </div>
                <div className='p-3 bg-white bg-opacity-20 rounded-full'>
                  <AdminIcon icon={DollarSign} className='w-8 h-8' />
                </div>
              </div>
              <div className='flex items-center gap-1 text-sm'>
                <AdminIcon icon={TrendingUp} className='w-4 h-4' />
                <span>
                  {period === 'month' && revenueRows.length >= 2
                    ? (() => {
                        const curr = revenueRows[revenueRows.length - 1]?.revenue ?? 0;
                        const prev = revenueRows[revenueRows.length - 2]?.revenue ?? 0;
                        const pct =
                          prev > 0 ? (((curr - prev) / prev) * 100).toFixed(1) : null;
                        return pct != null
                          ? `전월 대비 ${Number(pct) >= 0 ? '+' : ''}${pct}%`
                          : '전월 데이터 없음';
                      })()
                    : period === 'month'
                      ? '전월 데이터 없음'
                      : '실제 데이터'}
                </span>
              </div>
            </div>

            <div className='bg-gradient-to-br from-red-500 to-red-600 rounded-md shadow p-4 text-white'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <p className='text-sm opacity-90'>월 비용</p>
                  <p className='text-lg font-bold mt-1'>
                    ₩{formatNumber(dashboard?.monthlyCost || 0)}
                  </p>
                </div>
                <div className='p-3 bg-white bg-opacity-20 rounded-full'>
                  <AdminIcon icon={Zap} className='w-8 h-8' />
                </div>
              </div>
              <div className='flex items-center gap-1 text-sm'>
                <AdminIcon icon={TrendingDown} className='w-4 h-4' />
                <span>AI + 인프라</span>
              </div>
            </div>

            <div className='bg-gradient-to-br from-blue-500 to-blue-600 rounded-md shadow p-4 text-white'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <p className='text-sm opacity-90'>월 순이익</p>
                  <p className='text-lg font-bold mt-1'>
                    ₩{formatNumber(dashboard?.monthlyProfit || 0)}
                  </p>
                </div>
                <div className='p-3 bg-white bg-opacity-20 rounded-full'>
                  <AdminIcon icon={TrendingUp} className='w-8 h-8' />
                </div>
              </div>
              <div className='flex items-center gap-1 text-sm'>
                <span>마진 {(dashboard?.margin ?? 0).toFixed(1)}%</span>
              </div>
            </div>

            <div className='bg-gradient-to-br from-purple-500 to-purple-600 rounded-md shadow p-4 text-white'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <p className='text-sm opacity-90'>활성 구독자</p>
                  <p className='text-lg font-bold mt-1'>
                    {formatNumber(dashboard?.activeSubscribers || 0)}
                  </p>
                </div>
                <div className='p-3 bg-white bg-opacity-20 rounded-full'>
                  <AdminIcon icon={Users} className='w-8 h-8' />
                </div>
              </div>
              <div className='flex items-center gap-1 text-sm'>
                <span>ARPU ₩{formatNumber(dashboard?.avgRevenuePerUser || 0)}</span>
              </div>
            </div>
          </div>

          {/* 수익 구성 */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <div className='bg-white rounded-md shadow p-4'>
              <h3 className='text-lg font-semibold mb-4'>수익 구성</h3>
              <div className='space-y-4'>
                <div>
                  <div className='flex justify-between items-center mb-2'>
                    <div className='flex items-center gap-2'>
                      <AdminIcon icon={CreditCard} className='w-5 h-5 text-blue-600' />
                      <span className='font-medium'>구독 수익</span>
                    </div>
                    <span className='text-lg font-bold text-blue-600'>
                      ₩{formatNumber(dashboard?.monthlyRevenue ?? 0)}
                    </span>
                  </div>
                  <div className='bg-gray-200 rounded-full h-3'>
                    <div
                      className='bg-blue-600 h-3 rounded-full'
                      style={{
                        width:
                          (dashboard?.totalRevenue ?? 0) > 0
                            ? `${((dashboard?.monthlyRevenue ?? 0) / (dashboard?.totalRevenue ?? 1)) * 100}%`
                            : '0%',
                      }}
                    ></div>
                  </div>
                  <div className='text-sm text-gray-500 mt-1'>
                    {subscriptionByPlan.length > 0
                      ? subscriptionByPlan
                          .map((p) => `${p.planName}: ${p.count}명`)
                          .join(', ')
                      : '구독자 없음'}
                  </div>
                </div>

                <div>
                  <div className='flex justify-between items-center mb-2'>
                    <div className='flex items-center gap-2'>
                      <AdminIcon icon={Ticket} className='w-5 h-5 text-green-600' />
                      <span className='font-medium'>개별 구매</span>
                    </div>
                    <span className='text-lg font-bold text-green-600'>
                      ₩{formatNumber(dashboard?.singleRevenue ?? 0)}
                    </span>
                  </div>
                  <div className='bg-gray-200 rounded-full h-3'>
                    <div
                      className='bg-green-600 h-3 rounded-full'
                      style={{
                        width:
                          (dashboard?.totalRevenue ?? 0) > 0
                            ? `${((dashboard?.singleRevenue ?? 0) / (dashboard?.totalRevenue ?? 1)) * 100}%`
                            : '0%',
                      }}
                    ></div>
                  </div>
                  <div className='text-sm text-gray-500 mt-1'>
                    {singlePurchaseCount}장 판매
                    {(dashboard?.singleRevenue ?? 0) > 0 && singlePurchaseCount > 0
                      ? ` (₩${formatNumber(Math.round((dashboard?.singleRevenue ?? 0) / singlePurchaseCount))}/장)`
                      : ''}
                  </div>
                </div>
              </div>

              <div className='border-t mt-6 pt-4'>
                <div className='flex justify-between items-center'>
                  <span className='font-semibold text-gray-900'>총 수익</span>
                  <span className='text-base font-bold text-gray-900'>
                    ₩{formatNumber(dashboard?.totalRevenue ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className='bg-white rounded-md shadow p-4'>
              <h3 className='text-lg font-semibold mb-4'>비용 구성</h3>
              <div className='space-y-4'>
                {(dashboard?.monthlyCost ?? 0) > 0 ? (
                  <>
                    <div>
                      <div className='flex justify-between items-center mb-2'>
                        <span className='font-medium'>총 비용</span>
                        <span className='text-lg font-bold text-red-600'>
                          ₩{formatNumber(dashboard?.monthlyCost ?? 0)}
                        </span>
                      </div>
                      <div className='bg-gray-200 rounded-full h-3'>
                        <div
                          className='bg-red-600 h-3 rounded-full'
                          style={{
                            width:
                              (dashboard?.totalRevenue ?? 0) > 0
                                ? `${Math.min(100, ((dashboard?.monthlyCost ?? 0) / (dashboard?.totalRevenue ?? 1)) * 100)}%`
                                : '0%',
                          }}
                        ></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className='text-sm text-gray-500 py-4 space-y-2'>
                    <p>비용 데이터가 없습니다.</p>
                    <p>
                      AI 비용은{' '}
                      <Link href='/analytics' className='text-blue-600 hover:underline'>
                        AI 분석
                      </Link>{' '}
                      페이지에서 확인할 수 있습니다.
                    </p>
                  </div>
                )}
              </div>

              <div className='border-t mt-6 pt-4'>
                <div className='flex justify-between items-center'>
                  <span className='font-semibold text-gray-900'>총 비용</span>
                  <span className='text-base font-bold text-gray-900'>
                    ₩{formatNumber(dashboard?.monthlyCost ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 월별 추이 */}
          <div className='bg-white rounded-md shadow p-4'>
            <h3 className='text-lg font-semibold mb-4'>월별 수익 추이</h3>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b'>
                    <th className='text-left py-3 px-4'>기간</th>
                    <th className='text-right py-3 px-4'>매출</th>
                    <th className='text-right py-3 px-4'>비용</th>
                    <th className='text-right py-3 px-4'>순이익</th>
                    <th className='text-right py-3 px-4'>마진율</th>
                    <th className='text-right py-3 px-4'>구독자</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueRows.length > 0 ? (
                    revenueRows.map((row, idx) => (
                      <tr key={idx} className='border-b hover:bg-gray-50'>
                        <td className='py-3 px-4 font-medium'>{row.period}</td>
                        <td className='py-3 px-4 text-right'>₩{formatNumber(row.revenue)}</td>
                        <td className='py-3 px-4 text-right text-red-600'>
                          ₩{formatNumber(row.payout)}
                        </td>
                        <td className='py-3 px-4 text-right font-semibold text-green-600'>
                          ₩{formatNumber(row.profit)}
                        </td>
                        <td className='py-3 px-4 text-right'>
                          <span
                            className={`font-semibold ${
                              row.profit > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {row.revenue > 0
                              ? ((row.profit / row.revenue) * 100).toFixed(1)
                              : '0'}
                            %
                          </span>
                        </td>
                        <td className='py-3 px-4 text-right'>-</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className='py-8 text-center text-gray-500'>
                        데이터가 없습니다
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 사용자 규모별 수익 시뮬레이션 */}
          <div className='bg-white rounded-md shadow p-4'>
            <h3 className='text-lg font-semibold mb-4'>구독자 규모별 수익 예측</h3>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b'>
                    <th className='text-left py-3 px-4'>구독자 수</th>
                    <th className='text-right py-3 px-4'>월 매출</th>
                    <th className='text-right py-3 px-4'>AI 비용</th>
                    <th className='text-right py-3 px-4'>인프라 비용</th>
                    <th className='text-right py-3 px-4'>총 비용</th>
                    <th className='text-right py-3 px-4'>순이익</th>
                    <th className='text-right py-3 px-4'>마진율</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { subs: 100, revenue: 1940000, aiCost: 30240, infra: 31900 },
                    { subs: 500, revenue: 9700000, aiCost: 30240, infra: 31900 },
                    { subs: 1000, revenue: 19400000, aiCost: 30240, infra: 46900 },
                    { subs: 5000, revenue: 97000000, aiCost: 30240, infra: 92000 },
                  ].map((row, idx) => {
                    const totalCost = row.aiCost + row.infra;
                    const profit = row.revenue - totalCost;
                    const margin = (profit / row.revenue) * 100;

                    return (
                      <tr key={idx} className='border-b hover:bg-gray-50'>
                        <td className='py-3 px-4 font-medium'>{formatNumber(row.subs)}명</td>
                        <td className='py-3 px-4 text-right font-semibold text-blue-600'>
                          ₩{formatNumber(row.revenue)}
                        </td>
                        <td className='py-3 px-4 text-right'>₩{formatNumber(row.aiCost)}</td>
                        <td className='py-3 px-4 text-right'>₩{formatNumber(row.infra)}</td>
                        <td className='py-3 px-4 text-right text-red-600'>
                          ₩{formatNumber(totalCost)}
                        </td>
                        <td className='py-3 px-4 text-right font-bold text-green-600'>
                          ₩{formatNumber(profit)}
                        </td>
                        <td className='py-3 px-4 text-right'>
                          <span
                            className={`px-3 py-1 rounded-full font-semibold ${
                              margin >= 95
                                ? 'bg-green-100 text-green-700'
                                : margin >= 90
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className='mt-4 p-4 bg-blue-50 rounded-lg'>
              <h4 className='font-semibold text-blue-900 mb-2'>💡 핵심 인사이트</h4>
              <ul className='text-sm text-blue-800 space-y-1'>
                <li>• AI 비용은 고정: 구독자 수와 무관하게 월 ₩30,240</li>
                <li>• 인프라 비용: 구독자 1,000명까지 Railway로 ₩46,900 유지</li>
                <li>• 마진율: 구독자 증가 시 98%+로 상승 (매우 높은 수익성)</li>
                <li>• 손익분기점: 구독자 4명 (월 ₩77,600) - 이미 초과 달성!</li>
              </ul>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
