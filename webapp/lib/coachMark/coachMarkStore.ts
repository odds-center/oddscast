import { create } from 'zustand';
import type { TourId } from './coachMarkTypes';

const STORAGE_PREFIX = 'oddscast_coach_';

function getTourKey(id: TourId): string {
  return `${STORAGE_PREFIX}${id}`;
}

function hasCompletedTour(id: TourId): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return !!window.localStorage.getItem(getTourKey(id));
  } catch {
    return true;
  }
}

function markTourComplete(id: TourId): void {
  try {
    window.localStorage.setItem(getTourKey(id), '1');
  } catch {
    // ignore
  }
}

interface CoachMarkState {
  activeTourId: TourId | null;
  running: boolean;
  startTour: (id: TourId) => void;
  completeTour: (id: TourId) => void;
  skipTour: (id: TourId) => void;
  shouldAutoStart: (id: TourId, isLoggedIn: boolean) => boolean;
  resetTour: (id: TourId) => void;
  /** Hydrate completed tour state from server (called after user profile loads). */
  hydrateFromServer: (tourIds: string[]) => void;
}

export const useCoachMarkStore = create<CoachMarkState>((set) => ({
  activeTourId: null,
  running: false,

  startTour: (id) => {
    // Mark as seen immediately so navigation mid-tour won't retrigger on remount
    markTourComplete(id);
    set({ activeTourId: id, running: true });
  },

  completeTour: (id) => {
    markTourComplete(id);
    set({ activeTourId: null, running: false });
  },

  skipTour: (id) => {
    markTourComplete(id);
    set({ activeTourId: null, running: false });
  },

  shouldAutoStart: (id, isLoggedIn) => {
    if (!isLoggedIn) return false;
    return !hasCompletedTour(id);
  },

  // Allow manual re-trigger (e.g. "다시 보기" button)
  resetTour: (id) => {
    try {
      window.localStorage.removeItem(getTourKey(id));
    } catch {
      // ignore
    }
  },

  // Sync completed tours from server into localStorage so shouldAutoStart works correctly
  hydrateFromServer: (tourIds) => {
    for (const id of tourIds) {
      try {
        if (!window.localStorage.getItem(`${STORAGE_PREFIX}${id}`)) {
          window.localStorage.setItem(`${STORAGE_PREFIX}${id}`, '1');
        }
      } catch {
        // ignore
      }
    }
  },
}));
