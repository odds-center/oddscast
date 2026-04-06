/**
 * Prediction accuracy preview — prominent trust-building section
 * Larger numbers, clearer labels for 40-60 age readability
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import PredictionApi from '@/lib/api/predictionApi';
import HomeSection from './HomeSection';
import DataFetchState from '@/components/page/DataFetchState';
import { routes } from '@/lib/routes';
import Icon from '@/components/icons';

export default function AccuracyPreviewSection() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['predictions', 'accuracy-stats', 'preview'],
    queryFn: () => PredictionApi.getAccuracyStats(),
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
  });

  const overall = data?.overall;
  const pct = overall ? Math.round(overall.averageAccuracy) : null;
  const topMeet = data?.byMeet?.slice().sort((a, b) => b.averageAccuracy - a.averageAccuracy)[0];

  return (
    <HomeSection
      title='예측률'
      icon='Target'
      viewAllHref={routes.predictions.accuracy}
      viewAllLabel='상세보기'
    >
      <DataFetchState
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!overall || overall.totalCount === 0}
        emptyIcon='Target'
        emptyTitle='아직 집계된 예측 데이터가 없습니다'
        loadingLabel='준비 중...'
        errorDescription='통계를 불러올 수 없습니다.'
      >
        {overall && (
          <div className='space-y-3'>
            {/* Main accuracy display */}
            <div className='rounded-xl bg-primary/8 border border-primary/15 px-5 py-4 text-center'>
              <div className='flex items-center justify-center gap-1.5 mb-1.5'>
                <Icon name='Trophy' size={16} className='text-primary' />
                <span className='text-sm font-semibold text-primary'>예측률</span>
              </div>
              <p className='text-4xl font-extrabold text-primary leading-none'>{pct}<span className='text-2xl'>%</span></p>
            </div>
            {/* Stats row */}
            <div className='grid grid-cols-2 gap-2'>
              <div className='rounded-lg bg-stone-50 border border-stone-200 px-3 py-2.5 text-center'>
                <p className='text-lg font-bold text-foreground leading-none'>{overall.totalCount.toLocaleString()}</p>
                <p className='text-xs text-text-tertiary mt-1'>총 예측</p>
              </div>
              <div className='rounded-lg bg-stone-50 border border-stone-200 px-3 py-2.5 text-center'>
                <p className='text-lg font-bold text-success leading-none'>{overall.hitCount.toLocaleString()}</p>
                <p className='text-xs text-text-tertiary mt-1'>적중</p>
              </div>
            </div>
            {topMeet && (
              <div className='flex items-center justify-between px-1 text-sm'>
                <span className='text-text-secondary'>최고 경마장</span>
                <span className='font-bold text-foreground'>{topMeet.meet} {Math.round(topMeet.averageAccuracy)}%</span>
              </div>
            )}
          </div>
        )}
      </DataFetchState>
    </HomeSection>
  );
}
