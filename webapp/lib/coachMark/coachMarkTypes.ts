import type { Step } from 'react-joyride';

export type TourId =
  | 'homeTour'
  | 'raceTour'
  | 'raceDetailTour'
  | 'matrixTour'
  | 'profileTour';

export interface CoachMarkStep extends Step {
  // Extends react-joyride Step with our defaults applied in CoachMarkTour
}
