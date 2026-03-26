import type { Step } from 'react-joyride';

export type TourId =
  | 'homeTour'
  | 'raceTour'
  | 'raceDetailTour'
  | 'matrixTour'
  | 'profileTour';

export interface CoachMarkStep extends Step {
  /** Hide beacon and auto-show tooltip (v3: removed from Step but still works at runtime) */
  disableBeacon?: boolean;
}
