/**
 * Client-side recent race IDs (localStorage) for "Your recent races" on home (FEATURE_ROADMAP 5.2)
 */
const STORAGE_KEY = 'oddscast_recent_race_ids';
const MAX_IDS = 10;

export function getRecentRaceIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_IDS);
  } catch {
    return [];
  }
}

export function pushRecentRaceId(raceId: string): void {
  if (typeof window === 'undefined' || !raceId) return;
  try {
    const current = getRecentRaceIds();
    const next = [raceId, ...current.filter((id) => id !== raceId)].slice(0, MAX_IDS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
