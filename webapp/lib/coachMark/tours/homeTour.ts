import type { CoachMarkStep } from '../coachMarkTypes';

export const homeTourSteps: CoachMarkStep[] = [
  {
    target: '[data-tour="home-appbar"]',
    title: '화면 이동',
    content: '하단 메뉴로 경주·예상표·결과·프로필을 이동할 수 있어요.',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="home-quickmenu"]',
    title: '빠른 메뉴',
    content: '오늘 발매경주, 종합예상, 예측 정확도 등을 바로 이동할 수 있어요.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="home-today-races"]',
    title: '오늘의 경주',
    content: '오늘 열리는 경주 목록이에요. 경주를 탭하면 출전마와 AI 예측을 볼 수 있어요.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="home-ai-prediction"]',
    title: 'AI 예상표',
    content: 'AI가 분석한 종합 예상표 미리보기예요. 탭하면 전체 예상표를 확인할 수 있어요.',
    placement: 'top',
    disableBeacon: true,
  },
];
