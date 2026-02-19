/**
 * 용산종합지 스타일 — 종합 예상표
 * 로그인 필요. (향후 예측권/종합예상권 게이트 예정)
 * 탭: 종합 예상표 (Matrix) | AI/전문가 코멘트 (Feed)
 */
import { useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
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

function getDateParam(filter: string): string | undefined {
  if (!filter || filter === 'today') return undefined; // 오늘 = today
  if (filter === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }
  // YYYY-MM-DD
  if (/^\d{4}-?\d{2}-?\d{2}$/.test(filter.replace(/-/g, ''))) {
    return filter.includes('-') ? filter : `${filter.slice(0, 4)}-${filter.slice(4, 6)}-${filter.slice(6, 8)}`;
  }
  return undefined;
}

export default function PredictionMatrixPage() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const qDate = (router.query?.date as string) ?? 'today';
  const qMeet = (router.query?.meet as string) ?? '';
  const qTab = (router.query?.tab as TabId) ?? 'matrix';
  const activeTab = ['matrix', 'commentary'].includes(qTab) ? qTab : 'matrix';
  const dateFilter = qDate || 'today';
  const meetFilter = qMeet || '';

  const updateQuery = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = { ...router.query, ...updates };
      (Object.keys(updates) as (keyof typeof updates)[]).forEach((k) => {
        if (updates[k] === undefined || updates[k] === '') delete next[k];
      });
      router.replace({ pathname: router.pathname, query: next }, undefined, { shallow: true });
    },
    [router],
  );

  const apiDate = getDateParam(dateFilter);

  const { data: hitRecords } = useQuery({
    queryKey: ['predictions', 'hit-record'],
    queryFn: () => PredictionMatrixApi.getHitRecords(5),
    enabled: isLoggedIn,
  });

  const { data: matrixData, isLoading, error, refetch } = useQuery({
    queryKey: ['predictions', 'matrix', dateFilter, meetFilter],
    queryFn: () => PredictionMatrixApi.getMatrix(apiDate, meetFilter || undefined),
    enabled: isLoggedIn,
  });

  const {
    data: commentaryData,
    isLoading: commentaryLoading,
    error: commentaryError,
    refetch: commentaryRefetch,
  } = useQuery({
    queryKey: ['predictions', 'commentary', dateFilter, meetFilter],
    queryFn: () =>
      PredictionMatrixApi.getCommentary(apiDate, 20, 0, meetFilter || undefined),
    enabled: isLoggedIn && activeTab === 'commentary',
  });

  return (
    <Layout title='GOLDEN RACE'>
      <CompactPageTitle title='종합 예상표' backHref={routes.home} />

      {!isLoggedIn ? (
        <div className='rounded-xl border border-slate-200 bg-slate-50 p-6 text-center'>
          <RequireLogin
            suffix='종합 예상표를 확인할 수 있습니다'
            action={
              <Link href={routes.auth.login} className='btn-primary inline-flex items-center gap-1.5 px-4 py-2'>
                로그인하고 보기
              </Link>
            }
          />
          <p className='text-text-tertiary text-xs mt-4'>
            예측권으로 경주별 AI 분석을 더 자세히 확인하세요. —{' '}
            <Link href={routes.profile.index} className='text-slate-700 font-medium hover:underline'>
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
        filterOptions={[
          { value: 'today', label: '오늘' },
          { value: 'yesterday', label: '어제' },
          { value: 'date', label: '날짜' },
        ]}
        filterValue={
          dateFilter === 'today'
            ? 'today'
            : dateFilter === 'yesterday'
              ? 'yesterday'
              : /^\d{4}-?\d{2}-?\d{2}$/.test(String(dateFilter).replace(/-/g, ''))
                ? 'date'
                : 'today'
        }
        onFilterChange={(v) => {
          if (v === 'today') updateQuery({ date: 'today' });
          else if (v === 'yesterday') updateQuery({ date: 'yesterday' });
          else {
            const d = new Date();
            updateQuery({ date: d.toISOString().slice(0, 10) });
          }
        }}
        showDatePicker
        dateValue={
          dateFilter && dateFilter !== 'today' && dateFilter !== 'yesterday'
            ? dateFilter.includes('-')
              ? dateFilter
              : `${dateFilter.slice(0, 4)}-${dateFilter.slice(4, 6)}-${dateFilter.slice(6, 8)}`
            : dateFilter === 'yesterday'
              ? (() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  return d.toISOString().slice(0, 10);
                })()
              : dateFilter === 'today'
                ? new Date().toISOString().slice(0, 10)
                : ''
        }
        onDateChange={(v) => updateQuery({ date: v || undefined, meet: meetFilter || undefined })}
        dateId='matrix-date'
        showMeetFilter
        meetValue={meetFilter}
        onMeetChange={(v) => updateQuery({ date: dateFilter || undefined, meet: v || undefined })}
      />

      <TabBar
        options={[
          { value: 'matrix', label: '종합 예상표' },
          { value: 'commentary', label: 'AI/전문가 코멘트' },
        ]}
        value={activeTab}
        onChange={(v) => updateQuery({ tab: v })}
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
        <DataFetchState
          isLoading={commentaryLoading}
          error={commentaryError as Error | null}
          onRetry={() => commentaryRefetch()}
          isEmpty={!commentaryData?.comments?.length}
          emptyIcon='Sparkles'
          emptyTitle='코멘트가 없습니다'
          emptyDescription='해당 날짜에 AI 예측 코멘트가 없습니다.'
          loadingLabel='코멘트를 불러오는 중...'
        >
          {commentaryData?.comments && commentaryData.comments.length > 0 ? (
            <CommentaryFeed comments={commentaryData.comments} />
          ) : null}
        </DataFetchState>
      )}
        </>
      )}
    </Layout>
  );
}
