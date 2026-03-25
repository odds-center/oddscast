import type { CoachMarkStep } from '../coachMarkTypes';

export const raceTourSteps: CoachMarkStep[] = [
  {
    target: '[data-tour="race-filter"]',
    title: '경주 필터',
    content: '날짜와 경마장을 선택해 원하는 경주를 찾아보세요. 서울·부산·제주 모두 지원해요.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="race-list"]',
    title: '경주 목록',
    content: '경주를 탭하면 출전마 정보와 AI 예측 분석을 볼 수 있어요.',
    placement: 'bottom',
    disableBeacon: true,
  },
];
