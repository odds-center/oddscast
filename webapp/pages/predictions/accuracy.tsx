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

function formatMonth(month: string): string {
  const [y, m] = month.split('-');
  return `${y}년 ${m}월`;
}

function formatMeet(meet: string): string {
  const map: Record<string, string> = {
    서울: '서울',
    제주: '제주',
    부산경남: '부산·경남',
  };
  return map[meet] ?? meet;
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

  return (
    <Layout title='예측 정확도 | OddsCast'>
      <CompactPageTitle
        title='예측 정확도'
        backHref={routes.predictions.matrix}
      />
      <p className='text-sm text-text-secondary mb-4'>
        AI 예측 결과의 전체·월별·경마장별 정확도 통계입니다.
      </p>
      <DataFetchState
        isLoading={isLoading}
        error={error as Error | null}
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
                          <span className='text-[10px] text-text-tertiary truncate w-full text-center shrink-0'>
                            {row.month.slice(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className='data-table-wrapper rounded-xl border border-border overflow-hidden shadow-sm overflow-x-auto'>
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
                <div className='data-table-wrapper rounded-xl border border-border overflow-hidden shadow-sm overflow-x-auto'>
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
