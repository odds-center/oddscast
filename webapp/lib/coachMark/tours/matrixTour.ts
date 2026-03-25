import type { CoachMarkStep } from '../coachMarkTypes';

export const matrixTourSteps: CoachMarkStep[] = [
  {
    target: '[data-tour="matrix-filter"]',
    title: '날짜 선택',
    content: '보고 싶은 경주일을 선택하세요. 오늘을 포함한 지난 경주일도 확인할 수 있어요.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="matrix-table"]',
    title: '종합 예상표',
    content: '당일 전체 경주의 AI 예측을 한눈에 볼 수 있어요. 상위 2경주는 무료로 제공되며, 종합 예측권 1장으로 전체를 열람할 수 있어요.',
    placement: 'top',
    disableBeacon: true,
  },
];
