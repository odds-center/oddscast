/**
 * AI 예측 정확도 대시보드 — 전체/월별/경마장별 통계 (공개)
 */
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import SectionCard from '@/components/page/SectionCard';
import DataFetchState from '@/components/page/DataFetchState';
import { DataTable } from '@/components/ui';
import PredictionApi from '@/lib/api/predictionApi';
import type { AccuracyStatsResponse } from '@/lib/api/predictionApi';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { routes } from '@/lib/routes';
import { formatMeet } from '@/lib/utils/format';

function formatMonth(month: string): string {
  const [y, m] = month.split('-');
  return `${y}년 ${m}월`;
}

export default function PredictionAccuracyPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['predictions', 'accuracy-stats'],
    queryFn: () => PredictionApi.getAccuracyStats(),
    placeholderData: keepPreviousData,
  });

  const stats = data as AccuracyStatsResponse | undefined;
  const overall = stats?.overall;
  const byMonth = stats?.byMonth ?? [];
  const byMeet = stats?.byMeet ?? [];
  const byBetType = stats?.byBetType ?? [];

  return (
    <Layout title='예측 정확도 | OddsCast' description='OddsCast AI 예측의 적중률과 정확도 통계를 경마장별, 월별로 확인하세요.'>
      <CompactPageTitle
        title='예측 정확도'
        backHref={routes.predictions.matrix}
      />
      <p className='text-sm text-text-secondary mb-4'>
        AI 예측 결과의 전체·월별·경마장별 정확도 통계입니다.
      </p>
      <DataFetchState
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!overall && !isLoading}
        emptyIcon='BarChart2'
        emptyTitle='통계가 없습니다'
        emptyDescription='완료된 예측이 쌓이면 여기에 표시됩니다.'
        loadingLabel='통계 불러오는 중...'
      >
        {overall && (
          <>
            <SectionCard
              title='전체 요약'
              icon='BarChart2'
              description='완료된 예측 기준'
              className='mb-6'
            >
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                <div className='rounded-xl border border-border bg-background p-4'>
                  <p className='text-xs text-text-tertiary mb-0.5'>총 예측 수</p>
                  <p className='text-xl font-semibold'>{overall.totalCount.toLocaleString()}건</p>
                </div>
                <div className='rounded-xl border border-border bg-background p-4'>
                  <p className='text-xs text-text-tertiary mb-0.5'>적중 수</p>
                  <p className='text-xl font-semibold text-emerald-600'>
                    {overall.hitCount.toLocaleString()}건
                  </p>
                </div>
                <div className='rounded-xl border border-border bg-background p-4'>
                  <p className='text-xs text-text-tertiary mb-0.5'>평균 정확도</p>
                  <p className='text-xl font-semibold'>{overall.averageAccuracy}%</p>
                </div>
              </div>
            </SectionCard>

            {byBetType.length > 0 && (
              <SectionCard
                title='승식별 적중률'
                icon='Target'
                description='AI 추천마 기준'
                className='mb-6'
              >
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                  {byBetType.map((bt) => {
                    const isGood = bt.rate >= 40;
                    return (
                      <div
                        key={bt.type}
                        className='rounded-xl border border-border bg-background p-4 text-center'
                      >
                        <p className='text-xs text-text-tertiary mb-1'>{bt.label}</p>
                        <p className={`text-2xl font-bold tabular-nums ${isGood ? 'text-emerald-600' : 'text-foreground'}`}>
                          {bt.rate}%
                        </p>
                        <p className='text-[11px] text-text-tertiary mt-1'>
                          {bt.hit.toLocaleString()}/{bt.total.toLocaleString()}건
                        </p>
                        {/* Mini progress bar */}
                        <div className='mt-2 h-1.5 rounded-full bg-stone-100 overflow-hidden'>
                          <div
                            className={`h-full rounded-full transition-all ${isGood ? 'bg-emerald-500' : 'bg-stone-400'}`}
                            style={{ width: `${Math.min(100, bt.rate)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className='text-[11px] text-text-tertiary mt-3 leading-relaxed'>
                  단승: AI 1순위가 실제 1위 | 연승: AI 1순위가 3착 이내 | 복승: AI 상위 2마가 모두 3착 이내 | 삼복승: AI 상위 3마가 모두 3착 이내
                </p>
              </SectionCard>
            )}

            {byMonth.length > 0 && (
              <SectionCard
                title='월별 추이'
                icon='TrendingUp'
                description='최근 12개월'
                className='mb-6'
              >
                {/* Simple trend bar chart: height = averageAccuracy (0–100%) */}
                <div className='mb-4 rounded-xl border border-border bg-stone-50/50 p-4'>
                  <p className='text-xs text-text-tertiary font-semibold mb-3'>월별 평균 정확도</p>
                  <div
                    className='flex items-end gap-1'
                    style={{ height: 96 }}
                    aria-label='월별 정확도 막대 그래프'
                  >
                    {byMonth.map((row) => {
                      const pct = Math.min(100, Math.max(0, row.averageAccuracy));
                      return (
                        <div
                          key={row.month}
                          className='flex-1 min-w-0 flex flex-col items-center justify-end gap-0.5 h-full'
                          title={`${formatMonth(row.month)}: ${row.averageAccuracy}% (${row.count}건)`}
                        >
                          <div
                            className='w-full rounded-t bg-primary/80 min-h-[4px] transition-all'
                            style={{ height: `${(pct / 100) * 80}px` }}
                          />
                          <span className='text-[11px] text-text-tertiary truncate w-full text-center shrink-0'>
                            {row.month.slice(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Mobile: stat rows */}
                <div className='block sm:hidden divide-y divide-border rounded-xl border border-border overflow-hidden'>
                  {byMonth.map((r) => (
                    <div key={r.month} className='flex items-center justify-between py-2.5 px-3 bg-card'>
                      <span className='text-sm font-medium text-foreground'>{formatMonth(r.month)}</span>
                      <div className='flex items-center gap-3 text-sm text-text-secondary'>
                        <span>{r.count.toLocaleString()}건</span>
                        <span className='font-semibold text-primary'>{r.averageAccuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop: table */}
                <div className='hidden sm:block'>
                  <DataTable<{ month: string; count: number; averageAccuracy: number }>
                    columns={[
                      {
                        key: 'month',
                        header: '기간',
                        headerClassName: 'min-w-[90px]',
                        render: (r) => formatMonth(r.month),
                      },
                      {
                        key: 'count',
                        header: '예측 수',
                        align: 'right',
                        headerClassName: 'w-24',
                        render: (r) => r.count.toLocaleString(),
                      },
                      {
                        key: 'averageAccuracy',
                        header: '평균 정확도',
                        align: 'right',
                        headerClassName: 'w-28',
                        render: (r) => `${r.averageAccuracy}%`,
                      },
                    ]}
                    data={byMonth}
                    getRowKey={(r) => r.month}
                    compact
                  />
                </div>
              </SectionCard>
            )}

            {byMeet.length > 0 && (
              <SectionCard
                title='경마장별'
                icon='MapPin'
                description='시행 경마장별 정확도'
              >
                {/* Mobile: stat rows */}
                <div className='block sm:hidden divide-y divide-border rounded-xl border border-border overflow-hidden'>
                  {byMeet.map((r) => (
                    <div key={r.meet} className='flex items-center justify-between py-2.5 px-3 bg-card'>
                      <span className='text-sm font-medium text-foreground'>{formatMeet(r.meet)}</span>
                      <div className='flex items-center gap-3 text-sm text-text-secondary'>
                        <span>{r.count.toLocaleString()}건</span>
                        <span className='font-semibold text-primary'>{r.averageAccuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop: table */}
                <div className='hidden sm:block'>
                  <DataTable<{ meet: string; count: number; averageAccuracy: number }>
                    columns={[
                      {
                        key: 'meet',
                        header: '경마장',
                        headerClassName: 'min-w-[100px]',
                        render: (r) => formatMeet(r.meet),
                      },
                      {
                        key: 'count',
                        header: '예측 수',
                        align: 'right',
                        headerClassName: 'w-24',
                        render: (r) => r.count.toLocaleString(),
                      },
                      {
                        key: 'averageAccuracy',
                        header: '평균 정확도',
                        align: 'right',
                        headerClassName: 'w-28',
                        render: (r) => `${r.averageAccuracy}%`,
                      },
                    ]}
                    data={byMeet}
                    getRowKey={(r) => r.meet}
                    compact
                  />
                </div>
              </SectionCard>
            )}
          </>
        )}
      </DataFetchState>
    </Layout>
  );
}
