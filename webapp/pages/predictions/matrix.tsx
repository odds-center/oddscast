/**
 * Daily race comprehensive guide — Yongsan comprehensive style
 * View all daily race AI predictions with matrix ticket (1,000 KRW)
 */
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import { TabBar } from '@/components/ui';
import FilterDateBar from '@/components/page/FilterDateBar';
import DataFetchState from '@/components/page/DataFetchState';
import RequireLogin from '@/components/page/RequireLogin';
import { getErrorMessage } from '@/lib/utils/error';
import HitRecordBanner from '@/components/predictions/HitRecordBanner';
import PredictionMatrixTable from '@/components/predictions/PredictionMatrixTable';
import CommentaryFeed from '@/components/predictions/CommentaryFeed';
import PredictionMatrixApi from '@/lib/api/predictionMatrixApi';
import PredictionTicketsApi from '@/lib/api/predictionTicketApi';
import Icon from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/lib/store/authStore';
import { trackCTA } from '@/lib/analytics';
import { getTodayKstDate } from '@/lib/utils/format';
import type { GetServerSideProps } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { serverGet } from '@/lib/api/serverFetch';
import { dayjsKST } from '@/lib/utils/dayjs';

type TabId = 'matrix' | 'commentary';

const MATRIX_HINT_STORAGE_KEY = 'oddscast_matrix_hint_seen';

function getDateParam(filter: string): string | undefined {
  if (!filter || filter === 'today') return undefined;
  if (filter === 'yesterday') {
    return dayjsKST().subtract(1, 'day').format('YYYY-MM-DD');
  }
  if (/^\d{4}-?\d{2}-?\d{2}$/.test(filter.replace(/-/g, ''))) {
    return filter.includes('-') ? filter : `${filter.slice(0, 4)}-${filter.slice(4, 6)}-${filter.slice(6, 8)}`;
  }
  return undefined;
}

function formatDisplayDate(filter: string): string {
  const d = filter === 'today' || !filter
    ? dayjsKST()
    : filter === 'yesterday'
      ? dayjsKST().subtract(1, 'day')
      : dayjsKST(filter);
  const wd = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.year()}.${String(d.month() + 1).padStart(2, '0')}.${String(d.date()).padStart(2, '0')} (${wd[d.day()]})`;
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
  const apiDateStr = apiDate ?? (() => { const k = getTodayKstDate(); return `${k.year}-${String(k.month).padStart(2, '0')}-${String(k.day).padStart(2, '0')}`; })();

  const { data: hitRecords } = useQuery({
    queryKey: ['predictions', 'hit-record'],
    queryFn: () => PredictionMatrixApi.getHitRecords(5),
    enabled: isLoggedIn,
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

  const { data: matrixData, isLoading, error, refetch } = useQuery({
    queryKey: ['predictions', 'matrix', dateFilter, meetFilter, hasAccess],
    queryFn: () => PredictionMatrixApi.getMatrix(apiDate, meetFilter || undefined, hasAccess),
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

  const [showHint, setShowHint] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !window.localStorage.getItem(MATRIX_HINT_STORAGE_KEY);
    } catch {
      return false;
    }
  });
  const dismissHint = useCallback(() => {
    setShowHint(false);
    try {
      window.localStorage.setItem(MATRIX_HINT_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  }, []);

  const useMatrixMutation = useMutation({
    mutationFn: () => PredictionTicketsApi.consumeMatrixTicket(apiDateStr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions', 'matrix-access'] });
      queryClient.invalidateQueries({ queryKey: ['predictions', 'matrix-balance'] });
      queryClient.invalidateQueries({ queryKey: ['predictions', 'matrix'] });
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
    <Layout title='종합 예상 | OddsCast' description='AI가 분석한 당일 전 경주 종합 예상표. 7가지 승식별 추천마를 한눈에 확인하세요.'>
      <CompactPageTitle title='일일 종합 가이드' backHref={routes.home} />
      <div className='mb-2 flex justify-end'>
        <Link
          href={routes.predictions.accuracy}
          className='text-xs text-text-tertiary hover:text-primary transition-colors'
        >
          예측 적중률 통계 →
        </Link>
      </div>

      {!isLoggedIn ? (
        <div className='rounded border border-stone-200 bg-stone-50 p-6 text-center'>
          <RequireLogin
            suffix='종합 예상표를 확인할 수 있습니다'
            action={
              <Button asChild>
                <Link href={routes.auth.login}>
                  로그인하고 보기
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {showHint && (
            <div className='mb-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-start justify-between gap-3'>
              <p className='text-sm text-foreground whitespace-pre-line'>
                <span className='font-medium text-primary'>종합 예측표</span>에서는 날짜·경마장별로{'\n'}AI 예측을 한눈에 볼 수 있습니다.{'\n'}종합 예측권 1장으로 해당 날짜 전체를 열람할 수 있습니다.
              </p>
              <Button
                type='button'
                variant='link'
                size='sm'
                onClick={dismissHint}
                className='shrink-0'
              >
                확인
              </Button>
            </div>
          )}
          {/* Hero header */}
          <div className='home-hero mb-3'>
            <div className='relative z-10'>
              <div className='flex flex-col gap-2.5'>
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
                <div>
                  {hasAccess ? (
                    <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary text-white text-xs font-semibold'>
                      <Icon name='Unlock' size={12} />
                      열람 중
                    </span>
                  ) : (
                    <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 text-stone-400 text-xs font-medium'>
                      <Icon name='Lock' size={12} />
                      AI 예측 비공개
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {hitRecords && hitRecords.length > 0 && <HitRecordBanner records={hitRecords} />}

          <div>
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
                const kst = getTodayKstDate();
                updateQuery({ date: `${kst.year}-${String(kst.month).padStart(2, '0')}-${String(kst.day).padStart(2, '0')}` });
              }
            }}
            showDatePicker
            dateValue={
              dateFilter && dateFilter !== 'today' && dateFilter !== 'yesterday'
                ? dateFilter.includes('-') ? dateFilter : `${dateFilter.slice(0, 4)}-${dateFilter.slice(4, 6)}-${dateFilter.slice(6, 8)}`
                : dateFilter === 'yesterday'
                  ? (() => { const kst = getTodayKstDate(); const d = new Date(Date.UTC(kst.year, kst.month - 1, kst.day - 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`; })()
                  : dateFilter === 'today' ? (() => { const k = getTodayKstDate(); return `${k.year}-${String(k.month).padStart(2, '0')}-${String(k.day).padStart(2, '0')}`; })() : ''
            }
            onDateChange={(v) => updateQuery({ date: v || undefined, meet: meetFilter || undefined })}
            dateId='matrix-date'
            showMeetFilter
            meetValue={meetFilter}
            onMeetChange={(v) => updateQuery({ date: dateFilter || undefined, meet: v || undefined })}
          />
          </div>

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
              {/* Unlock CTA — visible when locked */}
              {!hasAccess && isLoggedIn && (
                <div className='rounded border border-[rgba(22,163,74,0.2)] bg-[rgba(22,163,74,0.04)] p-4 mb-3'>
                  <div className='flex flex-wrap items-center gap-3'>
                    <div className='w-9 h-9 rounded bg-primary flex items-center justify-center shrink-0'>
                      <Icon name='BarChart2' size={18} className='text-white' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-sm font-bold text-foreground'>AI 예측 열람하기</h3>
                      <p className='text-xs text-stone-500 mt-0.5 whitespace-pre-line'>
                        종합 예측권 1장으로 해당 날짜 전체{'\n'}AI 예측을 열람할 수 있습니다.{'\n'}(1일 1장 · 1,000원)
                      </p>
                    </div>
                    <div className='w-full sm:w-auto flex flex-col gap-1'>
                      {availableMatrixTickets > 0 ? (
                        <Button
                          onClick={() => useMatrixMutation.mutate()}
                          disabled={useMatrixMutation.isPending}
                          className='w-full sm:w-auto'
                        >
                          {useMatrixMutation.isPending ? '열람 중...' : `예측권 사용 (${availableMatrixTickets}장 보유)`}
                        </Button>
                      ) : (
                        <Button asChild className='w-full sm:w-auto'>
                          <Link href={routes.mypage.matrixTicketPurchase}>
                            <Icon name='CreditCard' size={16} />
                            종합 예측권 구매
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                  {useMatrixMutation.isError && (
                    <p className='text-error text-xs mt-2'>{getErrorMessage(useMatrixMutation.error) || '사용에 실패했습니다'}</p>
                  )}
                </div>
              )}

              <DataFetchState
                isLoading={isLoading}
                error={error}
                onRetry={() => refetch()}
                isEmpty={!matrixData?.raceMatrix?.length}
                emptyIcon='BarChart2'
                emptyTitle='예상 정보가 없습니다'
                emptyDescription={'선택한 날짜에 경주가 없거나\n아직 생성되지 않았습니다.\n다른 날짜를 선택해보세요.'}
                loadingLabel='예상표 준비 중...'
                errorTitle='종합 예상표를 불러올 수 없습니다'
              >
                {matrixData && (
                  <div className='space-y-3'>
                    <PredictionMatrixTable
                      data={matrixData}
                      date={dateFilter}
                      locked={!hasAccess}
                    />

                  </div>
                )}
              </DataFetchState>
            </>
          )}

          {activeTab === 'commentary' && (
            <>
              {!hasAccess && isLoggedIn && (
                <div className='rounded border border-[rgba(22,163,74,0.2)] bg-[rgba(22,163,74,0.04)] p-4 mb-3'>
                  <div className='flex flex-wrap items-center gap-3'>
                    <div className='w-9 h-9 rounded bg-primary flex items-center justify-center shrink-0'>
                      <Icon name='Sparkles' size={18} className='text-white' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <h3 className='text-sm font-bold text-foreground'>AI 코멘트 열람하기</h3>
                      <p className='text-xs text-stone-500 mt-0.5 whitespace-pre-line'>
                        종합 예측권 1장으로 해당 날짜 전체{'\n'}AI 코멘트를 열람할 수 있습니다.{'\n'}(1일 1장 · 1,000원)
                      </p>
                    </div>
                    <div className='w-full sm:w-auto flex flex-col gap-1'>
                      {availableMatrixTickets > 0 ? (
                        <Button
                          onClick={() => useMatrixMutation.mutate()}
                          disabled={useMatrixMutation.isPending}
                          className='w-full sm:w-auto'
                        >
                          {useMatrixMutation.isPending ? '열람 중...' : `예측권 사용 (${availableMatrixTickets}장 보유)`}
                        </Button>
                      ) : (
                        <Button asChild className='w-full sm:w-auto'>
                          <Link href={routes.mypage.matrixTicketPurchase}>
                            <Icon name='CreditCard' size={16} />
                            종합 예측권 구매
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                  {useMatrixMutation.isError && (
                    <p className='text-error text-xs mt-2'>{getErrorMessage(useMatrixMutation.error) || '사용에 실패했습니다'}</p>
                  )}
                </div>
              )}
              <DataFetchState
                isLoading={commentaryLoading}
                error={commentaryError}
                onRetry={() => commentaryRefetch()}
                isEmpty={!commentaryData?.comments?.length}
                emptyIcon='Sparkles'
                emptyTitle='코멘트가 없습니다'
                emptyDescription={'해당 날짜에 AI 예측 코멘트가 없습니다.\n다른 날짜를 선택해보세요.'}
                loadingLabel='코멘트 준비 중...'
                errorTitle='코멘트를 불러올 수 없습니다'
              >
                {commentaryData?.comments && commentaryData.comments.length > 0 ? (
                  <CommentaryFeed comments={commentaryData.comments} locked={!hasAccess} />
                ) : null}
              </DataFetchState>
            </>
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
  const kstToday = dayjsKST().format('YYYY-MM-DD');
  const apiDateStr = apiDate ?? kstToday;

  const queryClient = new QueryClient();
  try {
    const params: Record<string, string> = {};
    if (apiDateStr) params.date = apiDateStr;
    if (meetFilter) params.meet = meetFilter;
    await queryClient.prefetchQuery({
      queryKey: ['predictions', 'matrix', dateFilter, meetFilter, false],
      queryFn: () => serverGet<{ raceMatrix?: unknown[]; experts?: unknown[] }>('/predictions/matrix', { params }),
    });
  } catch {
    // Fetch on client if SSR fails
  }
  return { props: { dehydratedState: dehydrate(queryClient) } };
};
