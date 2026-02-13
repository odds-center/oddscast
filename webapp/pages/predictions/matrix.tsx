/**
 * 용산종합지 스타일 — 종합 예상표
 * 로그인 필요. (향후 예측권/종합예상권 게이트 예정)
 * 탭: 종합 예상표 (Matrix) | AI/전문가 코멘트 (Feed)
 */
import { useState } from 'react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/page/PageHeader';
import BackLink from '@/components/page/BackLink';
import { TabBar } from '@/components/ui';
import FilterDateBar from '@/components/page/FilterDateBar';
import DataFetchState from '@/components/page/DataFetchState';
import RequireLogin from '@/components/page/RequireLogin';
import HitRecordBanner from '@/components/predictions/HitRecordBanner';
import PredictionMatrixTable from '@/components/predictions/PredictionMatrixTable';
import CommentaryFeed from '@/components/predictions/CommentaryFeed';
import PredictionMatrixApi from '@/lib/api/predictionMatrixApi';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/lib/store/authStore';

type TabId = 'matrix' | 'commentary';

export default function PredictionMatrixPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [activeTab, setActiveTab] = useState<TabId>('matrix');
  const [dateFilter, setDateFilter] = useState<string>('today');

  const { data: hitRecords } = useQuery({
    queryKey: ['predictions', 'hit-record'],
    queryFn: () => PredictionMatrixApi.getHitRecords(5),
  });

  const { data: matrixData, isLoading, error, refetch } = useQuery({
    queryKey: ['predictions', 'matrix', dateFilter],
    queryFn: () =>
      PredictionMatrixApi.getMatrix(
        dateFilter === 'today' ? undefined : dateFilter,
        undefined,
      ),
  });

  const { data: commentaryData } = useQuery({
    queryKey: ['predictions', 'commentary', dateFilter],
    queryFn: () =>
      PredictionMatrixApi.getCommentary(dateFilter === 'today' ? undefined : dateFilter),
    enabled: activeTab === 'commentary',
  });

  return (
    <Layout title='종합 예상표 — GOLDEN RACE'>
      <BackLink href={routes.home} label='목록으로' className='mb-4 block' />

      <PageHeader icon='BarChart2' title='종합 예상표' />

      {!isLoggedIn ? (
        <div className='rounded-xl border border-primary/30 bg-primary/5 p-6 text-center'>
          <RequireLogin
            suffix='종합 예상표를 확인할 수 있습니다'
            action={
              <Link href={routes.auth.login} className='btn-primary inline-flex items-center gap-2 px-6 py-3'>
                로그인하고 보기
              </Link>
            }
          />
          <p className='text-text-tertiary text-xs mt-4'>
            예측권으로 경주별 AI 분석을 더 자세히 확인하세요. —{' '}
            <Link href={routes.profile.index} className='text-primary hover:underline'>
              내 정보
            </Link>
          </p>
        </div>
      ) : (
        <>
      {hitRecords && hitRecords.length > 0 && (
        <HitRecordBanner records={hitRecords} />
      )}

      <FilterDateBar
        filterOptions={[{ value: 'today', label: '오늘' }]}
        filterValue={dateFilter === 'today' ? 'today' : dateFilter || ''}
        onFilterChange={(v) => setDateFilter(v || 'today')}
        dateValue={dateFilter !== 'today' && dateFilter ? dateFilter : ''}
        onDateChange={(v) => setDateFilter(v || 'today')}
        dateId='matrix-date'
      />

      <TabBar
        options={[
          { value: 'matrix', label: '종합 예상표' },
          { value: 'commentary', label: 'AI/전문가 코멘트' },
        ]}
        value={activeTab}
        onChange={(v) => setActiveTab(v)}
        size='md'
        className='mb-4'
      />

      {activeTab === 'matrix' && (
        <DataFetchState
          isLoading={isLoading}
          error={error as Error | null}
          onRetry={() => refetch()}
          isEmpty={!matrixData?.raceMatrix?.length}
          emptyIcon='BarChart2'
          emptyTitle='예상 데이터가 없습니다'
          emptyDescription='다른 날짜를 선택해보세요.'
          loadingLabel='예상표를 불러오는 중...'
          errorTitle='데이터를 불러오지 못했습니다'
        >
          {matrixData && <PredictionMatrixTable data={matrixData} date={dateFilter} />}
        </DataFetchState>
      )}

      {activeTab === 'commentary' && (
        <section>
          {commentaryData?.comments ? (
            <CommentaryFeed comments={commentaryData.comments} />
          ) : (
            <p className='text-text-secondary text-sm text-center py-12'>코멘트를 불러오는 중...</p>
          )}
        </section>
      )}
        </>
      )}
    </Layout>
  );
}
