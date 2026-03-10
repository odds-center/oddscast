/**
 * Onboarding state utilities
 * - Logged-in users: persisted to DB via hasSeenOnboarding field
 * - Non-logged-in users: localStorage fallback
 */

const STORAGE_KEY = 'oddscast_onboarding_tutorial_done';

/** Check localStorage (fallback for non-logged-in users) */
export function hasSeenOnboardingLocal(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return !!window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
}

/** Mark onboarding as done in localStorage */
export function setOnboardingDoneLocal(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // ignore
  }
}
