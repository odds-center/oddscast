import type { CoachMarkStep } from '../coachMarkTypes';

export const raceDetailTourSteps: CoachMarkStep[] = [
  {
    target: '[data-tour="race-detail-entries"]',
    title: '출전마 정보',
    content: '경주에 출전하는 말들의 레이팅, 기수, 훈련 성적을 확인하세요.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="race-detail-ai"]',
    title: 'AI 예측 분석',
    content: 'AI가 수학적으로 분석한 각 말의 예측 점수와 추천 순위예요. 예측권 1장으로 상세 분석을 열람할 수 있어요.',
    placement: 'top',
    disableBeacon: true,
  },
];
