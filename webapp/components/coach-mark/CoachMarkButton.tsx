import Icon from '@/components/icons';
import { useCoachMarkStore } from '@/lib/coachMark/coachMarkStore';
import type { TourId } from '@/lib/coachMark/coachMarkTypes';

interface CoachMarkButtonProps {
  tourId: TourId;
  label?: string;
}

export default function CoachMarkButton({ tourId, label = '이용 가이드 보기' }: CoachMarkButtonProps) {
  const resetTour = useCoachMarkStore((s) => s.resetTour);
  const startTour = useCoachMarkStore((s) => s.startTour);

  const handleClick = () => {
    resetTour(tourId);
    startTour(tourId);
  };

  return (
    <button
      type='button'
      onClick={handleClick}
      className='inline-flex items-center gap-2 w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-primary hover:text-primary transition-colors touch-manipulation'
    >
      <Icon name='HelpCircle' size={18} className='text-primary shrink-0' />
      {label}
    </button>
  );
}
