import Joyride, { type CallBackProps, STATUS } from 'react-joyride';
import { useCoachMarkStore } from '@/lib/coachMark/coachMarkStore';
import type { CoachMarkStep, TourId } from '@/lib/coachMark/coachMarkTypes';
import { useAuthStore } from '@/lib/store/authStore';
import AuthApi from '@/lib/api/authApi';

interface CoachMarkTourProps {
  tourId: TourId;
  steps: CoachMarkStep[];
}

// Loaded via dynamic({ ssr: false }) from each page
export default function CoachMarkTour({ tourId, steps }: CoachMarkTourProps) {
  const activeTourId = useCoachMarkStore((s) => s.activeTourId);
  const running = useCoachMarkStore((s) => s.running);
  const completeTour = useCoachMarkStore((s) => s.completeTour);
  const skipTour = useCoachMarkStore((s) => s.skipTour);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const syncToServer = (id: TourId) => {
    if (!isLoggedIn) return;
    AuthApi.updateProfile({ completedTour: id }).catch(() => {});
  };

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED) {
      completeTour(tourId);
      syncToServer(tourId);
    } else if (status === STATUS.SKIPPED) {
      skipTour(tourId);
      syncToServer(tourId);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={running && activeTourId === tourId}
      continuous
      showSkipButton
      showProgress
      disableOverlayClose
      spotlightClicks={false}
      callback={handleCallback}
      locale={{
        back: '이전',
        close: '닫기',
        last: '완료',
        next: '다음',
        open: '열기',
        skip: '건너뛰기',
      }}
      styles={{
        options: {
          primaryColor: '#16a34a',
          zIndex: 9000,
          arrowColor: '#ffffff',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.55)',
        },
        tooltip: {
          borderRadius: '12px',
          fontSize: '15px',
          padding: '20px 22px',
          maxWidth: '320px',
        },
        tooltipTitle: {
          fontSize: '17px',
          fontWeight: 700,
          marginBottom: '6px',
        },
        tooltipContent: {
          fontSize: '15px',
          lineHeight: 1.6,
          padding: '0',
          color: '#44403c',
        },
        tooltipFooter: {
          marginTop: '16px',
        },
        buttonNext: {
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '15px',
          fontWeight: 600,
          minHeight: '44px',
          backgroundColor: '#16a34a',
        },
        buttonBack: {
          color: '#57534e',
          fontSize: '14px',
          fontWeight: 500,
          minHeight: '44px',
          marginRight: '8px',
        },
        buttonSkip: {
          color: '#a8a29e',
          fontSize: '13px',
        },
        spotlight: {
          borderRadius: '10px',
        },
      }}
    />
  );
}
