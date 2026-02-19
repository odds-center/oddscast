import { useState } from 'react';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import { adminStatisticsApi } from '@/lib/api/admin';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import { AdminIcon } from '@/components/common/AdminIcon';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function StatisticsPage() {
  const [usersDays, setUsersDays] = useState(30);
  const [betsDays, setBetsDays] = useState(30);

  // 사용자 증가 추이
  const { data: usersGrowth, isLoading: usersLoading } = useQuery({
    queryKey: ['users-growth', usersDays],
    queryFn: () => adminStatisticsApi.getUsersGrowth(usersDays),
  });

  // 베팅 트렌드
  const { data: betsTrend, isLoading: betsLoading } = useQuery({
    queryKey: ['bets-trend', betsDays],
    queryFn: () => adminStatisticsApi.getBetsTrend(betsDays),
  });

  return (
    <>
      <Head>
        <title>통계 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader
            title='통계'
            description='플랫폼의 주요 지표와 통계를 확인할 수 있습니다.'
          />

          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {/* 사용자 증가 추이 */}
            <Card title='사용자 증가 추이' description='신규 가입자 및 활성 사용자'>
              <div className='mb-4 flex justify-between items-center'>
                <select
                  value={usersDays}
                  onChange={(e) => setUsersDays(Number(e.target.value))}
                  className='px-3 py-2 border rounded-lg'
                >
                  <option value={7}>최근 7일</option>
                  <option value={30}>최근 30일</option>
                  <option value={90}>최근 90일</option>
                </select>
              </div>
              {usersLoading ? (
                <div className='flex items-center justify-center h-64'>
                  <LoadingSpinner size='md' label='로딩 중...' />
                </div>
              ) : usersGrowth && usersGrowth.length > 0 ? (
                <div className='space-y-2'>
                  {usersGrowth.slice(0, 10).map((day, idx) => (
                    <div key={idx} className='flex items-center gap-4'>
                      <div className='w-24 text-sm text-gray-600'>{day.date}</div>
                      <div className='flex-1'>
                        <div className='bg-gray-200 rounded-full h-6'>
                          <div
                            className='bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2'
                            style={{
                              width: `${Math.min((Number(day.count) / Math.max(...usersGrowth.map((d) => Number(d.count)))) * 100, 100)}%`,
                            }}
                          >
                            <span className='text-xs text-white font-semibold'>{day.count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex items-center justify-center h-64'>
                  <div className='text-center text-gray-500'>
                    <AdminIcon icon={Users} className='h-16 w-16 mx-auto mb-4' />
                    <p>데이터가 없습니다</p>
                  </div>
                </div>
              )}
            </Card>

            {/* 결제 트렌드 */}
            <Card title='결제 트렌드' description='일별 결제 건수 및 금액'>
              <div className='mb-4 flex justify-between items-center'>
                <select
                  value={betsDays}
                  onChange={(e) => setBetsDays(Number(e.target.value))}
                  className='px-3 py-2 border rounded-lg'
                >
                  <option value={7}>최근 7일</option>
                  <option value={30}>최근 30일</option>
                  <option value={90}>최근 90일</option>
                </select>
              </div>
              {betsLoading ? (
                <div className='flex items-center justify-center h-64'>
                  <LoadingSpinner size='md' label='로딩 중...' />
                </div>
              ) : betsTrend && betsTrend.length > 0 ? (
                <div className='space-y-3'>
                  {betsTrend.slice(0, 10).map((day, idx) => (
                    <div key={idx} className='border-b pb-3 last:border-0'>
                      <div className='flex justify-between items-center mb-2'>
                        <span className='text-sm font-medium text-gray-700'>{day.date}</span>
                        <span className='text-sm text-gray-600'>{Number(day.count)}건</span>
                      </div>
                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div>
                          <div className='text-gray-500'>베팅 금액</div>
                          <div className='font-semibold text-blue-600'>
                            ₩{formatNumber(Number(day.amount))}
                          </div>
                        </div>
                        <div>
                          <div className='text-gray-500'>당첨 금액</div>
                          <div className='font-semibold text-green-600'>
                            ₩{formatNumber(Number(day.winAmount))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex items-center justify-center h-64'>
                  <div className='text-center text-gray-500'>
                    <AdminIcon icon={DollarSign} className='h-16 w-16 mx-auto mb-4' />
                    <p>데이터가 없습니다</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </Layout>
    </>
  );
}
