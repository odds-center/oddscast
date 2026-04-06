/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Coach mark tour component — react-joyride v3 wrapper.
 * Loaded via dynamic({ ssr: false }) from each page.
 * Uses `any` cast because react-joyride v3 types are incompatible with runtime API.
 */
import { Joyride, STATUS } from 'react-joyride';
import { useCoachMarkStore } from '@/lib/coachMark/coachMarkStore';
import type { CoachMarkStep, TourId } from '@/lib/coachMark/coachMarkTypes';
import { useAuthStore } from '@/lib/store/authStore';
import AuthApi from '@/lib/api/authApi';

const JoyrideAny = Joyride as any;

interface CoachMarkTourProps {
  tourId: TourId;
  steps: CoachMarkStep[];
}

export default function CoachMarkTour({ tourId, steps }: CoachMarkTourProps) {
  const activeTourId = useCoachMarkStore((s) => s.activeTourId);
  const running = useCoachMarkStore((s) => s.running);
  const completeTour = useCoachMarkStore((s) => s.completeTour);
  const skipTour = useCoachMarkStore((s) => s.skipTour);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const syncToServer = (id: TourId) => {
    if (!isLoggedIn) return;
    AuthApi.updateProfile({ completedTour: id } as Record<string, unknown>).catch(() => {});
  };

  const handleCallback = (data: { status: string }) => {
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
    <JoyrideAny
      steps={steps}
      run={running && activeTourId === tourId}
      continuous
      showSkipButton
      showProgress
      disableOverlayClose
      scrollToFirstStep={false}
      disableScrolling
      disableScrollParentFix
      spotlightClicks={false}
      spotlightPadding={6}
      callback={handleCallback}
      floaterProps={{ disableAnimation: true, offset: 12 }}
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
          overlayColor: 'rgba(0, 0, 0, 0.45)',
        },
        tooltip: {
          borderRadius: '12px',
          fontSize: '13px',
          padding: '12px 14px',
          maxWidth: '240px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.10), 0 1px 6px rgba(0,0,0,0.06)',
        },
        tooltipTitle: {
          fontSize: '13px',
          fontWeight: 700,
          marginBottom: '3px',
        },
        tooltipContent: {
          fontSize: '12px',
          lineHeight: 1.55,
          padding: '0',
          color: '#44403c',
        },
        tooltipFooter: {
          marginTop: '10px',
        },
        buttonNext: {
          borderRadius: '7px',
          padding: '6px 14px',
          fontSize: '12px',
          fontWeight: 600,
          minHeight: '32px',
          backgroundColor: '#16a34a',
        },
        buttonBack: {
          color: '#57534e',
          fontSize: '12px',
          fontWeight: 500,
          minHeight: '32px',
          marginRight: '4px',
        },
        buttonSkip: {
          color: '#a8a29e',
          fontSize: '11px',
        },
        spotlight: {
          borderRadius: '12px',
        },
      }}
    />
  );
}
