import { useState } from 'react';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import { adminAIApi } from '@/lib/api/admin';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { AdminIcon } from '@/components/common/AdminIcon';
import PageLoading from '@/components/common/PageLoading';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // AI 대시보드 데이터
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['ai-dashboard'],
    queryFn: () => adminAIApi.getAccuracyDashboard(),
  });

  // 비용 데이터
  const { data: costData } = useQuery({
    queryKey: ['ai-cost'],
    queryFn: () => adminAIApi.getCost(),
  });

  // 실패 분석
  const { data: failureAnalysis } = useQuery({
    queryKey: ['ai-failures', dateRange],
    queryFn: () =>
      adminAIApi.analyzeFailures({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
  });

  if (isLoading) {
    return (
      <>
        <Head>
          <title>AI 분석 | GoldenRace Admin</title>
        </Head>
        <Layout>
          <PageLoading label='데이터를 불러오는 중...' />
        </Layout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>AI 분석 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader
            title='AI 예측 성과 분석'
            description='AI 예측의 정확도, 비용, ROI를 실시간으로 분석합니다'
          />

          {/* 주요 지표 카드 */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='bg-white rounded-md shadow p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>전체 정확도</p>
                  <p className='text-lg font-bold text-blue-600 mt-2'>
                    {(dashboard?.overall?.accuracy ?? 0).toFixed(1)}%
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>
                    {dashboard?.overall.correctPredictions || 0}/
                    {dashboard?.overall.totalPredictions || 0} 적중
                  </p>
                </div>
                <div className='p-3 bg-blue-100 rounded-full'>
                  <AdminIcon icon={Target} className='w-8 h-8 text-blue-600' />
                </div>
              </div>
            </div>

            <div className='bg-white rounded-md shadow p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>평균 신뢰도</p>
                  <p className='text-lg font-bold text-green-600 mt-2'>
                    {(dashboard?.overall?.avgConfidence ?? 0).toFixed(1)}%
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>AI 확신 수준</p>
                </div>
                <div className='p-3 bg-green-100 rounded-full'>
                  <AdminIcon icon={Brain} className='w-8 h-8 text-green-600' />
                </div>
              </div>
            </div>

            <div className='bg-white rounded-md shadow p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>총 비용</p>
                  <p className='text-lg font-bold text-yellow-600 mt-2'>
                    ₩{formatNumber(costData?.totalCost || 0)}
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>누적 AI 호출 비용</p>
                </div>
                <div className='p-3 bg-yellow-100 rounded-full'>
                  <AdminIcon icon={DollarSign} className='w-8 h-8 text-yellow-600' />
                </div>
              </div>
            </div>

            <div className='bg-white rounded-md shadow p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>총 예측 수</p>
                  <p className='text-lg font-bold text-purple-600 mt-2'>
                    {formatNumber(dashboard?.overall.totalPredictions || 0)}
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>생성된 예측</p>
                </div>
                <div className='p-3 bg-purple-100 rounded-full'>
                  <AdminIcon icon={CheckCircle} className='w-8 h-8 text-purple-600' />
                </div>
              </div>
            </div>
          </div>

          {/* 포지션별 정확도 */}
          <div className='bg-white rounded-md shadow p-4'>
            <h3 className='text-lg font-semibold mb-4'>포지션별 정확도</h3>
            <div className='grid grid-cols-3 gap-4'>
              <div className='text-center'>
                <div className='text-4xl font-bold text-blue-600 mb-2'>
                  {(dashboard?.byPosition?.first?.accuracy ?? 0).toFixed(1)}%
                </div>
                <div className='text-sm text-gray-600'>1위 예측</div>
                <div className='text-xs text-gray-500 mt-1'>
                  {dashboard?.byPosition?.first?.correct ?? 0}/
                  {dashboard?.byPosition?.first?.total ?? 0}
                </div>
              </div>

              <div className='text-center'>
                <div className='text-4xl font-bold text-green-600 mb-2'>
                  {(dashboard?.byPosition?.second?.accuracy ?? 0).toFixed(1)}%
                </div>
                <div className='text-sm text-gray-600'>2위 예측</div>
                <div className='text-xs text-gray-500 mt-1'>
                  {dashboard?.byPosition?.second?.correct ?? 0}/
                  {dashboard?.byPosition?.second?.total ?? 0}
                </div>
              </div>

              <div className='text-center'>
                <div className='text-4xl font-bold text-yellow-600 mb-2'>
                  {(dashboard?.byPosition?.third?.accuracy ?? 0).toFixed(1)}%
                </div>
                <div className='text-sm text-gray-600'>3위 예측</div>
                <div className='text-xs text-gray-500 mt-1'>
                  {dashboard?.byPosition?.third?.correct ?? 0}/
                  {dashboard?.byPosition?.third?.total ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* 최근 7일 트렌드 */}
          <div className='bg-white rounded-md shadow p-4'>
            <h3 className='text-lg font-semibold mb-4'>최근 7일 정확도 트렌드</h3>
            <div className='space-y-3'>
              {(dashboard?.recent7Days ?? []).map((day, idx) => (
                <div key={idx} className='flex items-center gap-4'>
                  <div className='w-24 text-sm text-gray-600'>{day.date}</div>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 bg-gray-200 rounded-full h-4'>
                        <div
                          className='bg-blue-600 h-4 rounded-full'
                          style={{ width: `${day.accuracy ?? 0}%` }}
                        ></div>
                      </div>
                      <div className='w-16 text-sm font-semibold text-right'>
                        {(day.accuracy ?? 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className='w-20 text-sm text-gray-500 text-right'>{day.count}건</div>
                </div>
              ))}
            </div>
          </div>

          {/* 제공자별 성능 */}
          <div className='bg-white rounded-md shadow p-4'>
            <h3 className='text-lg font-semibold mb-4'>LLM 제공자별 성능</h3>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b'>
                    <th className='text-left py-3 px-4'>제공자</th>
                    <th className='text-right py-3 px-4'>정확도</th>
                    <th className='text-right py-3 px-4'>예측 수</th>
                    <th className='text-right py-3 px-4'>평균 비용</th>
                    <th className='text-right py-3 px-4'>총 비용</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard?.byProvider ?? []).map((provider, idx) => (
                    <tr key={idx} className='border-b hover:bg-gray-50'>
                      <td className='py-3 px-4 font-medium'>{provider.provider}</td>
                      <td className='py-3 px-4 text-right'>
                        <span
                          className={`font-semibold ${
                            (provider.accuracy ?? 0) >= 35
                              ? 'text-green-600'
                              : (provider.accuracy ?? 0) >= 25
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {(provider.accuracy ?? 0).toFixed(1)}%
                        </span>
                      </td>
                      <td className='py-3 px-4 text-right'>{provider.count}</td>
                      <td className='py-3 px-4 text-right'>₩{(provider.avgCost ?? 0).toFixed(0)}</td>
                      <td className='py-3 px-4 text-right font-semibold'>
                        ₩{((provider.avgCost ?? 0) * (provider.count ?? 0)).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 실패 원인 분석 */}
          <div className='bg-white rounded-md shadow p-4'>
            <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
              <AdminIcon icon={AlertTriangle} className='w-5 h-5 text-yellow-600' />
              실패 원인 분석
            </h3>
            <div className='flex flex-wrap items-center gap-3 mb-4'>
              <input
                type='date'
                value={dateRange.startDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                className='px-3 py-2 border border-gray-300 rounded-md text-sm'
              />
              <span className='text-gray-500'>~</span>
              <input
                type='date'
                value={dateRange.endDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                className='px-3 py-2 border border-gray-300 rounded-md text-sm'
              />
              <span className='text-sm text-gray-500'>분석 기간</span>
            </div>
          {failureAnalysis ? (
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <div className='text-sm text-gray-600'>총 실패 수</div>
                    <div className='text-base font-bold text-red-600'>
                      {failureAnalysis.totalFailures}
                    </div>
                  </div>
                  <div>
                    <div className='text-sm text-gray-600'>평균 오차 거리</div>
                    <div className='text-base font-bold text-gray-900'>
                      {(failureAnalysis?.avgMissDistance ?? 0).toFixed(1)}위
                    </div>
                  </div>
                </div>

                <div className='border-t pt-4'>
                  <h4 className='font-semibold mb-3'>주요 실패 원인</h4>
                  <div className='space-y-2'>
                    {(failureAnalysis?.byReason ?? []).map((reason, idx) => (
                      <div key={idx} className='flex items-center gap-3'>
                        <div className='flex-1'>
                          <div className='flex justify-between items-center mb-1'>
                            <span className='text-sm'>{reason.reason}</span>
                            <span className='text-sm font-semibold'>
                              {reason.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className='bg-gray-200 rounded-full h-2'>
                            <div
                              className='bg-red-500 h-2 rounded-full'
                              style={{ width: `${reason.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className='text-sm text-gray-500'>{reason.count}건</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='border-t pt-4'>
                  <h4 className='font-semibold mb-2'>공통 패턴</h4>
                  <div className='flex flex-wrap gap-2'>
                    {(failureAnalysis?.commonPatterns ?? []).map((pattern, idx) => (
                      <span
                        key={idx}
                        className='px-3 py-1 bg-gray-100 text-sm rounded-full text-gray-700'
                      >
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
          ) : (
            <div className='text-sm text-gray-500 py-4'>선택 기간 내 실패 데이터가 없습니다.</div>
          )}
          </div>
        </div>
      </Layout>
    </>
  );
}
