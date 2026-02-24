/**
 * Prediction accuracy preview — 8th home slot, links to /predictions/accuracy
 */
import HomeSection from './HomeSection';
import { routes } from '@/lib/routes';

export default function AccuracyPreviewSection() {
  return (
    <HomeSection
      title='예측 정확도'
      icon='Target'
      viewAllHref={routes.predictions.accuracy}
      viewAllLabel='더보기'
    >
      <div className='py-6 text-center'>
        <p className='text-sm text-text-secondary'>
          AI 예측 적중률을 월별·경마장별로 확인할 수 있어요.
        </p>
      </div>
    </HomeSection>
  );
}
