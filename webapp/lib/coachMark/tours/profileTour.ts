import type { CoachMarkStep } from '../coachMarkTypes';

export const profileTourSteps: CoachMarkStep[] = [
  {
    target: '[data-tour="profile-stats"]',
    title: '내 예측권',
    content: '보유한 개별 예측권과 종합 예측권 수를 확인할 수 있어요.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="profile-menu"]',
    title: '메뉴',
    content: '구독 플랜, 예측권 이력, 알림 설정 등을 여기서 관리할 수 있어요.',
    placement: 'top',
    disableBeacon: true,
  },
];
