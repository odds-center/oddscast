import { useState } from 'react';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import DataFetchState from '@/components/page/DataFetchState';
import RequireLogin from '@/components/page/RequireLogin';
import Pagination from '@/components/page/Pagination';
import Icon from '@/components/icons';
import CommunityPredictionsApi from '@/lib/api/communityPredictionsApi';
import type { CommunityPrediction } from '@/lib/api/communityPredictionsApi';
import { useAuthStore } from '@/lib/store/authStore';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { routes } from '@/lib/routes';
import { formatDateTime } from '@/lib/utils/format';

const PAGE_LIMIT = 20;

/** Score badge: green for positive, stone for zero/unscored */
function ScoreBadge({ score, scoredAt }: { score: number; scoredAt: string | null }) {
  if (!scoredAt) {
    return (
      <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-500'>
        <Icon name='Clock' size={12} />
        채점 대기
      </span>
    );
  }
  if (score <= 0) {
    return (
      <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600'>
        {score}점
      </span>
    );
  }
  return (
    <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700'>
      <Icon name='CheckCircle' size={12} />
      +{score}점
    </span>
  );
}

function PredictionCard({ prediction }: { prediction: CommunityPrediction }) {
  return (
    <div className='rounded-xl border border-border bg-card p-4 flex flex-col gap-2.5'>
      {/* Header: race id + created time */}
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-1.5 text-sm text-text-secondary'>
          <Icon name='Flag' size={14} className='shrink-0' />
          <span>경주 #{prediction.raceId}</span>
        </div>
        <ScoreBadge score={prediction.score} scoredAt={prediction.scoredAt} />
      </div>

      {/* Predicted horse numbers */}
      <div>
        <p className='text-xs text-text-tertiary mb-1.5'>선택한 말 번호</p>
        <div className='flex flex-wrap gap-1.5'>
          {prediction.predictedHrNos.map((hrNo) => (
            <span
              key={hrNo}
              className='inline-flex items-center justify-center w-8 h-8 rounded-full bg-stone-800 text-white text-sm font-bold tabular-nums'
            >
              {hrNo}
            </span>
          ))}
        </div>
      </div>

      {/* Timestamps */}
      <div className='flex items-center justify-between gap-2 pt-1 border-t border-border'>
        <p className='text-xs text-text-tertiary'>
          제출: {formatDateTime(prediction.createdAt)}
        </p>
        {prediction.scoredAt && (
          <p className='text-xs text-text-tertiary'>
            채점: {formatDateTime(prediction.scoredAt)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function MyPredictionsPage() {
  const [page, setPage] = useState(1);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['community-predictions', 'my', page],
    queryFn: () => CommunityPredictionsApi.getMyPredictions(page, PAGE_LIMIT),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.total / PAGE_LIMIT) : 1;

  return (
    <Layout
      title='내 예측 | OddsCast'
      description='내가 제출한 커뮤니티 경주 예측 목록입니다.'
    >
      <CompactPageTitle title='내 예측' backHref={routes.community.index} />

      {!isLoggedIn && (
        <RequireLogin suffix='내 예측을 확인할 수 있습니다' />
      )}

      {isLoggedIn && (
        <>
          <p className='text-sm text-text-secondary mb-4'>
            제출한 예측과 채점 결과를 확인하세요.
          </p>

          <DataFetchState
            isLoading={isLoading}
            error={error}
            onRetry={() => refetch()}
            isEmpty={items.length === 0}
            emptyIcon='ListChecks'
            emptyTitle='제출한 예측이 없습니다'
            emptyDescription={'경주 상세 페이지에서\n예측을 제출해 보세요.'}
            loadingLabel='예측 불러오는 중...'
            errorTitle='예측을 불러오지 못했습니다'
            errorDescription='잠시 후 다시 시도해 주세요.'
          >
            <div className='space-y-3'>
              {items.map((prediction) => (
                <PredictionCard key={prediction.id} prediction={prediction} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
                className='mt-6'
              />
            )}
          </DataFetchState>
        </>
      )}
    </Layout>
  );
}
