/**
 * Daily race comprehensive guide — Yongsan comprehensive style
 * View all daily race AI predictions with matrix ticket (1,000 KRW)
 */
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
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
import PredictionTicketsApi from '@/lib/api/predictionTicketApi';
import Icon from '@/components/icons';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/lib/store/authStore';
import { trackCTA } from '@/lib/analytics';
import type { GetServerSideProps } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { serverGet } from '@/lib/api/serverFetch';

type TabId = 'matrix' | 'commentary';

const MATRIX_HINT_STORAGE_KEY = 'oddscast_matrix_hint_seen';

function getDateParam(filter: string): string | undefined {
  if (!filter || filter === 'today') return undefined;
  if (filter === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }
  if (/^\d{4}-?\d{2}-?\d{2}$/.test(filter.replace(/-/g, ''))) {
    return filter.includes('-') ? filter : `${filter.slice(0, 4)}-${filter.slice(4, 6)}-${filter.slice(6, 8)}`;
  }
  return undefined;
}

function formatDisplayDate(filter: string): string {
  const d = filter === 'today' || !filter
    ? new Date()
    : filter === 'yesterday'
      ? (() => { const x = new Date(); x.setDate(x.getDate() - 1); return x; })()
      : new Date(filter);
  const wd = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${wd[d.getDay()]})`;
}

export default function PredictionMatrixPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
  const apiDateStr = apiDate ?? new Date().toISOString().slice(0, 10);

  const { data: hitRecords } = useQuery({
    queryKey: ['predictions', 'hit-record'],
    queryFn: () => PredictionMatrixApi.getHitRecords(5),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const { data: matrixData, isLoading, error, refetch } = useQuery({
    queryKey: ['predictions', 'matrix', dateFilter, meetFilter],
    queryFn: () => PredictionMatrixApi.getMatrix(apiDate, meetFilter || undefined),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const {
    data: commentaryData,
    isLoading: commentaryLoading,
    error: commentaryError,
    refetch: commentaryRefetch,
  } = useQuery({
    queryKey: ['predictions', 'commentary', dateFilter, meetFilter],
    queryFn: () => PredictionMatrixApi.getCommentary(apiDate, 20, 0, meetFilter || undefined),
    enabled: isLoggedIn && activeTab === 'commentary',
    placeholderData: keepPreviousData,
  });

  const { data: matrixAccess } = useQuery({
    queryKey: ['predictions', 'matrix-access', apiDateStr],
    queryFn: () => PredictionTicketsApi.checkMatrixAccess(apiDateStr),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const { data: matrixBalance } = useQuery({
    queryKey: ['predictions', 'matrix-balance'],
    queryFn: () => PredictionTicketsApi.getMatrixBalance(),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const hasAccess = matrixAccess?.hasAccess ?? false;
  const availableMatrixTickets = matrixBalance?.available ?? 0;

  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setShowHint(!window.localStorage.getItem(MATRIX_HINT_STORAGE_KEY));
    } catch {
      setShowHint(false);
    }
  }, []);
  const dismissHint = useCallback(() => {
    setShowHint(false);
    try {
      window.localStorage.setItem(MATRIX_HINT_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  }, []);

  const useMatrixMutation = useMutation({
    mutationFn: () => PredictionTicketsApi.useMatrixTicket(apiDateStr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions', 'matrix-access'] });
      queryClient.invalidateQueries({ queryKey: ['predictions', 'matrix-balance'] });
      trackCTA('MATRIX_TICKET_USE');
    },
  });

  const raceCount = matrixData?.raceMatrix?.length ?? 0;
  const meetGroups = useMemo(() => {
    if (!matrixData?.raceMatrix) return {};
    const map: Record<string, number> = {};
    for (const row of matrixData.raceMatrix) {
      const name = row.meetName ?? row.meet ?? '기타';
      map[name] = (map[name] ?? 0) + 1;
    }
    return map;
  }, [matrixData]);

  return (
    <Layout title='종합 예상 — OddsCast'>
      <CompactPageTitle title='일일 종합 가이드' backHref={routes.home} />
      <div className='mb-2 flex justify-end'>
        <Link
          href={routes.predictions.accuracy}
          className='text-xs text-text-tertiary hover:text-primary transition-colors'
        >
          예측 정확도 통계 →
        </Link>
      </div>

      {!isLoggedIn ? (
        <div className='rounded border border-stone-200 bg-stone-50 p-6 text-center'>
          <RequireLogin
            suffix='종합 예상표를 확인할 수 있습니다'
            action={
              <Link href={routes.auth.login} className='btn-primary inline-flex items-center gap-1.5 px-4 py-2'>
                로그인하고 보기
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {showHint && (
            <div className='mb-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-start justify-between gap-3'>
              <p className='text-sm text-foreground'>
                <span className='font-medium text-primary'>종합 예측표</span>에서는 날짜·경마장별로 AI 예측을 한눈에 볼 수 있습니다. 종합 예측권 1장으로 해당 날짜 전체를 열람할 수 있습니다.
              </p>
              <button
                type='button'
                onClick={dismissHint}
                className='shrink-0 text-sm font-medium text-primary hover:underline'
              >
                확인
              </button>
            </div>
          )}
          {/* Hero header */}
          <div className='home-hero mb-3'>
            <div className='relative z-10'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <p className='text-stone-400 text-xs mb-0.5'>일일 경주 종합 가이드</p>
                  <h2 className='text-base font-bold text-white'>{formatDisplayDate(dateFilter)}</h2>
                  <div className='flex items-center gap-3 mt-1.5 text-xs text-stone-400'>
                    <span className='inline-flex items-center gap-1'>
                      <Icon name='Flag' size={12} className='text-primary' />
                      {raceCount}경주
                    </span>
                    {Object.entries(meetGroups).map(([meet, cnt]) => (
                      <span key={meet} className='whitespace-nowrap'>{meet} {cnt}경</span>
                    ))}
                  </div>
                </div>
                {/* Matrix ticket status */}
                <div className='text-right shrink-0'>
                  {hasAccess ? (
                    <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary text-white text-xs font-semibold'>
                      <Icon name='Unlock' size={12} />
                      열람 중
                    </span>
                  ) : (
                    <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 text-stone-400 text-xs font-medium'>
                      <Icon name='Lock' size={12} />
                      잠금
                    </span>
                  )}
                  {!hasAccess && (
                    <p className='text-[10px] text-stone-500 mt-1'>
                      예측권 {availableMatrixTickets}장 보유
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {hitRecords && hitRecords.length > 0 && <HitRecordBanner records={hitRecords} />}

          <FilterDateBar
            filterOptions={[
              { value: 'today', label: '오늘' },
              { value: 'yesterday', label: '어제' },
              { value: 'date', label: '날짜' },
            ]}
            filterValue={
              dateFilter === 'today' ? 'today'
                : dateFilter === 'yesterday' ? 'yesterday'
                  : /^\d{4}-?\d{2}-?\d{2}$/.test(String(dateFilter).replace(/-/g, '')) ? 'date' : 'today'
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
                ? dateFilter.includes('-') ? dateFilter : `${dateFilter.slice(0, 4)}-${dateFilter.slice(4, 6)}-${dateFilter.slice(6, 8)}`
                : dateFilter === 'yesterday'
                  ? (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })()
                  : dateFilter === 'today' ? new Date().toISOString().slice(0, 10) : ''
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
              { value: 'commentary', label: 'AI 코멘트' },
            ]}
            value={activeTab}
            onChange={(v) => updateQuery({ tab: v })}
            size='md'
            className='mb-3'
          />

          {activeTab === 'matrix' && (
            <>
              {/* 종합 예측권 사용/구매 CTA — 항상 노출 (잠금 시 테이블 위에 표시) */}
              {!hasAccess && isLoggedIn && (
                <div className='rounded border border-[rgba(22,163,74,0.2)] bg-[rgba(22,163,74,0.04)] p-4 mb-3'>
                  <div className='flex flex-wrap items-center gap-3'>
                    <div className='w-9 h-9 rounded bg-primary flex items-center justify-center shrink-0'>
                      <Icon name='BarChart2' size={18} className='text-white' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-sm font-bold text-foreground'>종합 예측권으로 열람하기</h3>
                      <p className='text-xs text-stone-500 mt-0.5'>
                        하루 전체 경주의 AI 예상을 한눈에 — 1일 1장 · 1,000원/장
                      </p>
                    </div>
                    <div className='flex items-center gap-2 shrink-0'>
                      {availableMatrixTickets > 0 ? (
                        <button
                          onClick={() => useMatrixMutation.mutate()}
                          disabled={useMatrixMutation.isPending}
                          className='btn-primary text-sm px-4 py-2'
                        >
                          {useMatrixMutation.isPending ? '열람 중...' : `종합 예측권 사용 (${availableMatrixTickets}장)`}
                        </button>
                      ) : (
                        <Link href={routes.mypage.matrixTicketPurchase} className='btn-primary inline-flex items-center gap-1.5 text-sm px-4 py-2'>
                          <Icon name='CreditCard' size={16} />
                          종합 예측권 구매
                        </Link>
                      )}
                    </div>
                  </div>
                  {useMatrixMutation.isError && (
                    <p className='msg-error text-xs mt-2'>{(useMatrixMutation.error as Error)?.message ?? '사용에 실패했습니다'}</p>
                  )}
                </div>
              )}

              <DataFetchState
                isLoading={isLoading}
                error={error as Error | null}
                onRetry={() => refetch()}
                isEmpty={!matrixData?.raceMatrix?.length}
                emptyIcon='BarChart2'
                emptyTitle='예상 정보가 없습니다'
                emptyDescription='다른 날짜를 선택해보세요.'
                loadingLabel='예상표 준비 중...'
                errorTitle='일시적인 오류가 발생했습니다'
              >
                {matrixData && (
                  <div className='space-y-3'>
                    <PredictionMatrixTable
                      data={matrixData}
                      date={dateFilter}
                      locked={!hasAccess}
                      previewCount={3}
                    />

                  </div>
                )}
              </DataFetchState>
            </>
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
              loadingLabel='코멘트 준비 중...'
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const query = context.query as Record<string, string | undefined>;
  const dateFilter = query?.date ?? 'today';
  const meetFilter = query?.meet ?? '';
  const apiDate = getDateParam(dateFilter);
  const apiDateStr = apiDate ?? new Date().toISOString().slice(0, 10);

  const queryClient = new QueryClient();
  try {
    const params: Record<string, string> = {};
    if (apiDateStr) params.date = apiDateStr;
    if (meetFilter) params.meet = meetFilter;
    await queryClient.prefetchQuery({
      queryKey: ['predictions', 'matrix', dateFilter, meetFilter],
      queryFn: () => serverGet<{ raceMatrix?: unknown[]; experts?: unknown[] }>('/predictions/matrix', { params       }),
    });
  } catch {
    // Fetch on client if SSR fails
  }
  return { props: { dehydratedState: dehydrate(queryClient) } };
};
