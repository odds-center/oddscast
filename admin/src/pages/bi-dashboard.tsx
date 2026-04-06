import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import { adminBIApi } from '@/lib/api/admin';
import { formatCurrency, formatNumber, formatDateTime, getErrorMessage } from '@/lib/utils';
import {
  Users,
  Crown,
  TrendingUp,
  TrendingDown,
  Brain,
  CheckCircle,
  AlertTriangle,
  Database,
  CalendarDays,
  Ticket,
  RefreshCw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AdminIcon } from '@/components/common/AdminIcon';
import type { BIDashboardAnalytics } from '@/lib/types/admin';

// Auto-refresh interval in milliseconds
const AUTO_REFRESH_MS = 60_000;

// Stat card component for consistent layout
function StatCard({
  label,
  value,
  sub,
  icon,
  iconBg,
  iconColor,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  highlight?: 'red' | 'green' | 'amber';
}) {
  const valueColor =
    highlight === 'red'
      ? 'text-red-600'
      : highlight === 'green'
      ? 'text-emerald-600'
      : highlight === 'amber'
      ? 'text-amber-600'
      : 'text-gray-900';

  return (
    <div className='relative overflow-hidden rounded-xl bg-white p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow'>
      <div className='flex items-start justify-between'>
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-medium text-gray-500 truncate'>{label}</p>
          <p className={`mt-2 text-2xl font-bold ${valueColor}`}>{value}</p>
          {sub && <p className='mt-1 text-xs text-gray-400 truncate'>{sub}</p>}
        </div>
        <div className={`${iconBg} p-2.5 rounded-xl shrink-0 ml-3`}>
          <AdminIcon icon={icon} className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

// Section heading component
function SectionHeading({ title, icon }: { title: string; icon: LucideIcon }) {
  return (
    <div className='flex items-center gap-2 mb-3'>
      <AdminIcon icon={icon} className='h-4 w-4 text-gray-500' />
      <h2 className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>{title}</h2>
    </div>
  );
}

// Simple bar visualization for subscription plan distribution
function PlanDistributionBar({
  plans,
}: {
  plans: { LIGHT: number; STANDARD: number; PREMIUM: number };
}) {
  const total = plans.LIGHT + plans.STANDARD + plans.PREMIUM;
  if (total === 0) {
    return <p className='text-sm text-gray-400 py-4 text-center'>구독 데이터 없음</p>;
  }

  const items: Array<{ label: string; count: number; color: string; bg: string }> = [
    { label: 'LIGHT', count: plans.LIGHT, color: 'bg-sky-400', bg: 'bg-sky-50' },
    { label: 'STANDARD', count: plans.STANDARD, color: 'bg-violet-500', bg: 'bg-violet-50' },
    { label: 'PREMIUM', count: plans.PREMIUM, color: 'bg-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className='space-y-3'>
      {/* Stacked bar */}
      <div className='flex rounded-full overflow-hidden h-4 w-full'>
        {items.map((item) => {
          const pct = total > 0 ? (item.count / total) * 100 : 0;
          return pct > 0 ? (
            <div
              key={item.label}
              className={`${item.color} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${item.label}: ${item.count}명 (${pct.toFixed(1)}%)`}
            />
          ) : null;
        })}
      </div>
      {/* Legend */}
      <div className='grid grid-cols-3 gap-2'>
        {items.map((item) => {
          const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
          return (
            <div key={item.label} className={`${item.bg} rounded-lg p-2.5 text-center`}>
              <div className='flex items-center justify-center gap-1.5 mb-1'>
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className='text-xs font-semibold text-gray-700'>{item.label}</span>
              </div>
              <p className='text-base font-bold text-gray-900'>{formatNumber(item.count)}</p>
              <p className='text-xs text-gray-500'>{pct}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Skeleton loader for stat cards
function StatCardSkeleton() {
  return (
    <div className='rounded-xl bg-white p-5 shadow-sm border border-gray-100 animate-pulse'>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='h-3 bg-gray-200 rounded w-3/4 mb-3' />
          <div className='h-7 bg-gray-200 rounded w-1/2 mb-2' />
          <div className='h-2.5 bg-gray-100 rounded w-2/3' />
        </div>
        <div className='w-10 h-10 bg-gray-100 rounded-xl ml-3' />
      </div>
    </div>
  );
}

export default function BIDashboardPage() {
  const [data, setData] = useState<BIDashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await adminBIApi.getDashboardAnalytics();
      setData(result);
      setLastRefreshed(new Date());
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      void fetchData();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchData]);

  return (
    <>
      <Head>
        <title>BI 대시보드 | OddsCast Admin</title>
      </Head>
      <Layout>
        <div className='space-y-6'>
          <div className='flex items-start justify-between gap-4'>
            <PageHeader
              title='BI 대시보드'
              description='사용자·수익·예측 성능·운영 현황을 한눈에 확인하는 종합 지표 대시보드입니다. 60초마다 자동 갱신됩니다.'
            />
            <div className='shrink-0 flex items-center gap-3 pt-1'>
              {lastRefreshed && (
                <span className='text-xs text-gray-400 hidden sm:block'>
                  마지막 갱신: {formatDateTime(lastRefreshed)}
                </span>
              )}
              <Button
                type='button'
                variant='secondary'
                size='sm'
                onClick={() => {
                  setIsLoading(true);
                  void fetchData();
                }}
              >
                <AdminIcon icon={RefreshCw} className='h-3.5 w-3.5 mr-1.5' />
                새로고침
              </Button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className='rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'>
              <p className='font-medium'>데이터를 불러오는 중 오류가 발생했습니다.</p>
              <p className='mt-1 text-red-600'>{error}</p>
              <Button
                type='button'
                variant='secondary'
                size='sm'
                className='mt-2'
                onClick={() => {
                  setIsLoading(true);
                  void fetchData();
                }}
              >
                다시 시도
              </Button>
            </div>
          )}

          {/* ─── 1. 사용자 & 구독 ─── */}
          <section>
            <SectionHeading title='사용자 & 구독' icon={Users} />
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
              ) : (
                <>
                  <StatCard
                    label='전체 사용자'
                    value={formatNumber(data?.users.total ?? 0)}
                    sub='가입된 총 회원 수'
                    icon={Users}
                    iconBg='bg-blue-50'
                    iconColor='text-blue-600'
                  />
                  <StatCard
                    label='오늘 신규 가입'
                    value={formatNumber(data?.users.newToday ?? 0)}
                    sub='오늘(KST) 가입'
                    icon={TrendingUp}
                    iconBg='bg-emerald-50'
                    iconColor='text-emerald-600'
                    highlight={data?.users.newToday ? 'green' : undefined}
                  />
                  <StatCard
                    label='이번달 신규 가입'
                    value={formatNumber(data?.users.newThisMonth ?? 0)}
                    sub={`이번주 ${formatNumber(data?.users.newThisWeek ?? 0)}명 포함`}
                    icon={CalendarDays}
                    iconBg='bg-violet-50'
                    iconColor='text-violet-600'
                  />
                  <StatCard
                    label='활성 구독자'
                    value={formatNumber(data?.users.activeSubscribers ?? 0)}
                    sub='현재 구독 유지 중'
                    icon={Crown}
                    iconBg='bg-amber-50'
                    iconColor='text-amber-600'
                  />
                </>
              )}
            </div>
          </section>

          {/* ─── 2. 수익 & 구독 플랜 분포 ─── */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Revenue cards */}
            <section>
              <SectionHeading title='수익' icon={TrendingUp} />
              <div className='grid grid-cols-1 gap-4'>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
                ) : (
                  <>
                    <StatCard
                      label='MRR (월 반복 수익)'
                      value={formatCurrency(data?.revenue.mrr ?? 0)}
                      sub='활성 구독 기반 월 예상 수익'
                      icon={Crown}
                      iconBg='bg-emerald-50'
                      iconColor='text-emerald-600'
                      highlight='green'
                    />
                    <StatCard
                      label='이번달 총 매출'
                      value={formatCurrency(data?.revenue.thisMonthTotal ?? 0)}
                      sub='구독 + 개별 구매 합산'
                      icon={TrendingUp}
                      iconBg='bg-blue-50'
                      iconColor='text-blue-600'
                    />
                    <StatCard
                      label='이탈율'
                      value={`${(data?.revenue.churnRate ?? 0).toFixed(1)}%`}
                      sub={`이번달 취소 ${formatNumber(data?.revenue.cancelledThisMonth ?? 0)}건`}
                      icon={TrendingDown}
                      iconBg='bg-red-50'
                      iconColor='text-red-500'
                      highlight={
                        (data?.revenue.churnRate ?? 0) > 10
                          ? 'red'
                          : (data?.revenue.churnRate ?? 0) > 5
                          ? 'amber'
                          : undefined
                      }
                    />
                  </>
                )}
              </div>
            </section>

            {/* Subscription plan distribution */}
            <section>
              <SectionHeading title='구독 플랜 분포' icon={Crown} />
              <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-5'>
                {isLoading ? (
                  <div className='animate-pulse space-y-3'>
                    <div className='h-4 bg-gray-200 rounded-full w-full' />
                    <div className='grid grid-cols-3 gap-2'>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className='h-16 bg-gray-100 rounded-lg' />
                      ))}
                    </div>
                  </div>
                ) : (
                  <PlanDistributionBar plans={data?.users.subscriptionsByPlan ?? { LIGHT: 0, STANDARD: 0, PREMIUM: 0 }} />
                )}
              </div>
            </section>
          </div>

          {/* ─── 3. AI 예측 성능 ─── */}
          <section>
            <SectionHeading title='AI 예측 성능' icon={Brain} />
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
              ) : (
                <>
                  <StatCard
                    label='총 예측 생성 수'
                    value={formatNumber(data?.predictions.totalGenerated ?? 0)}
                    sub='전체 누적 예측'
                    icon={Brain}
                    iconBg='bg-teal-50'
                    iconColor='text-teal-600'
                  />
                  <StatCard
                    label='전체 평균 정확도'
                    value={`${(data?.predictions.avgAccuracy ?? 0).toFixed(1)}%`}
                    sub='완료된 예측 기준'
                    icon={CheckCircle}
                    iconBg='bg-emerald-50'
                    iconColor='text-emerald-600'
                    highlight={
                      (data?.predictions.avgAccuracy ?? 0) >= 40
                        ? 'green'
                        : (data?.predictions.avgAccuracy ?? 0) >= 25
                        ? 'amber'
                        : 'red'
                    }
                  />
                  <StatCard
                    label='이번달 정확도'
                    value={`${(data?.predictions.accuracyThisMonth ?? 0).toFixed(1)}%`}
                    sub='이번달 완료 예측 기준'
                    icon={TrendingUp}
                    iconBg='bg-blue-50'
                    iconColor='text-blue-600'
                    highlight={
                      (data?.predictions.accuracyThisMonth ?? 0) >= 40
                        ? 'green'
                        : (data?.predictions.accuracyThisMonth ?? 0) >= 25
                        ? 'amber'
                        : 'red'
                    }
                  />
                  <StatCard
                    label='고신뢰도 예측'
                    value={formatNumber(data?.predictions.highConfidenceCount ?? 0)}
                    sub='winProb ≥ 70% 예측 수'
                    icon={CheckCircle}
                    iconBg='bg-violet-50'
                    iconColor='text-violet-600'
                  />
                </>
              )}
            </div>
          </section>

          {/* ─── 4. 운영 현황 & 티켓 ─── */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Operations */}
            <section>
              <SectionHeading title='운영 현황' icon={Database} />
              <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-0 divide-y divide-gray-100'>
                {isLoading ? (
                  <div className='animate-pulse space-y-4 py-2'>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className='flex justify-between'>
                        <div className='h-3.5 bg-gray-200 rounded w-1/3' />
                        <div className='h-3.5 bg-gray-100 rounded w-1/4' />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className='flex items-center justify-between py-3'>
                      <span className='text-sm text-gray-600'>배치 성공률</span>
                      <span
                        className={`text-sm font-bold ${
                          (data?.operations.batchSuccessRate ?? 0) >= 90
                            ? 'text-emerald-600'
                            : (data?.operations.batchSuccessRate ?? 0) >= 70
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {(data?.operations.batchSuccessRate ?? 0).toFixed(1)}%
                      </span>
                    </div>
                    <div className='flex items-center justify-between py-3'>
                      <span className='text-sm text-gray-600'>오늘 실패한 배치</span>
                      <span
                        className={`text-sm font-bold ${
                          (data?.operations.batchFailedToday ?? 0) > 0 ? 'text-red-600' : 'text-gray-500'
                        }`}
                      >
                        {formatNumber(data?.operations.batchFailedToday ?? 0)}건
                        {(data?.operations.batchFailedToday ?? 0) > 0 && (
                          <AdminIcon icon={AlertTriangle} className='inline h-3.5 w-3.5 ml-1 text-red-500' />
                        )}
                      </span>
                    </div>
                    <div className='flex items-center justify-between py-3'>
                      <span className='text-sm text-gray-600'>KRA 마지막 동기화</span>
                      <span className='text-sm text-gray-700 font-medium'>
                        {data?.operations.kraLastSyncAt
                          ? formatDateTime(data.operations.kraLastSyncAt)
                          : '기록 없음'}
                      </span>
                    </div>
                    <div className='flex items-center justify-between py-3'>
                      <span className='text-sm text-gray-600'>오늘 경주 수</span>
                      <span className='text-sm font-bold text-gray-900'>
                        {formatNumber(data?.operations.racesToday ?? 0)}경주
                      </span>
                    </div>
                    <div className='flex items-center justify-between py-3'>
                      <span className='text-sm text-gray-600'>오늘 완료된 경주</span>
                      <span className='text-sm font-bold text-emerald-600'>
                        {formatNumber(data?.operations.racesCompleted ?? 0)}경주
                      </span>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Ticket metrics */}
            <section>
              <SectionHeading title='예측권 현황' icon={Ticket} />
              <div className='bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-0 divide-y divide-gray-100'>
                {isLoading ? (
                  <div className='animate-pulse space-y-4 py-2'>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className='flex justify-between'>
                        <div className='h-3.5 bg-gray-200 rounded w-1/3' />
                        <div className='h-3.5 bg-gray-100 rounded w-1/4' />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className='flex items-center justify-between py-3'>
                      <div>
                        <p className='text-sm text-gray-600'>RACE 티켓 (보유 중)</p>
                        <p className='text-xs text-gray-400 mt-0.5'>전체 사용자 AVAILABLE 합산</p>
                      </div>
                      <span className='text-sm font-bold text-blue-600'>
                        {formatNumber(data?.tickets.raceTicketsActive ?? 0)}장
                      </span>
                    </div>
                    <div className='flex items-center justify-between py-3'>
                      <div>
                        <p className='text-sm text-gray-600'>MATRIX 티켓 (보유 중)</p>
                        <p className='text-xs text-gray-400 mt-0.5'>종합예상표 유효 티켓</p>
                      </div>
                      <span className='text-sm font-bold text-violet-600'>
                        {formatNumber(data?.tickets.matrixTicketsActive ?? 0)}장
                      </span>
                    </div>
                    <div className='flex items-center justify-between py-3'>
                      <div>
                        <p className='text-sm text-gray-600'>이번달 사용 티켓</p>
                        <p className='text-xs text-gray-400 mt-0.5'>RACE + MATRIX 합산</p>
                      </div>
                      <span className='text-sm font-bold text-emerald-600'>
                        {formatNumber(data?.tickets.ticketsUsedThisMonth ?? 0)}장
                      </span>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </Layout>
    </>
  );
}
