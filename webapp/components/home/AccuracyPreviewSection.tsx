/**
 * Prediction accuracy preview — shows live overall accuracy stats on home page
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import PredictionApi from '@/lib/api/predictionApi';
import { Button } from '@/components/ui/button';
import HomeSection from './HomeSection';
import { routes } from '@/lib/routes';

export default function AccuracyPreviewSection() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['predictions', 'accuracy-stats', 'preview'],
    queryFn: () => PredictionApi.getAccuracyStats(),
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000, // 10 min — accuracy doesn't change often
  });

  const overall = data?.overall;
  const pct = overall ? Math.round(overall.averageAccuracy) : null;
  const topMeet = data?.byMeet?.slice().sort((a, b) => b.averageAccuracy - a.averageAccuracy)[0];

  return (
    <HomeSection
      title='예측 정확도'
      icon='Target'
      viewAllHref={routes.predictions.accuracy}
      viewAllLabel='상세보기'
    >
      {isLoading ? (
        <div className='py-6 text-center text-stone-400 text-sm'>준비 중...</div>
      ) : error ? (
        <div className='py-4 text-center'>
          <p className='text-xs text-text-secondary'>통계를 불러올 수 없습니다.</p>
          <Button type='button' variant='outline' size='sm' onClick={() => refetch()} className='mt-2'>
            다시 시도
          </Button>
        </div>
      ) : !overall || overall.totalCount === 0 ? (
        <div className='py-6 text-center text-stone-400 text-sm'>아직 집계된 예측 데이터가 없습니다.</div>
      ) : (
        <div className='flex items-stretch gap-3'>
          {/* Big accuracy number */}
          <div className='flex-1 rounded-xl bg-primary/8 border border-primary/15 px-4 py-3 text-center'>
            <p className='text-3xl font-bold text-primary leading-none'>{pct}%</p>
            <p className='text-xs text-text-secondary mt-1'>3착 이내 적중률</p>
          </div>
          {/* Stats */}
          <div className='flex-1 rounded-xl bg-stone-50 border border-stone-200 px-4 py-3 space-y-1.5'>
            <div className='flex justify-between items-center text-xs'>
              <span className='text-text-tertiary'>총 예측</span>
              <span className='font-semibold text-foreground'>{overall.totalCount.toLocaleString()}건</span>
            </div>
            <div className='flex justify-between items-center text-xs'>
              <span className='text-text-tertiary'>적중</span>
              <span className='font-semibold text-success'>{overall.hitCount.toLocaleString()}건</span>
            </div>
            {topMeet && (
              <div className='flex justify-between items-center text-xs'>
                <span className='text-text-tertiary'>최고 경마장</span>
                <span className='font-semibold text-foreground'>
                  {topMeet.meet} {Math.round(topMeet.averageAccuracy)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </HomeSection>
  );
}
