/**
 * Format utilities for display — shared for dates, times, numbers
 * All time displays use ko-KR locale (AM/PM)
 */

const LOCALE = 'ko-KR';
const TZ = 'Asia/Seoul';

/** Today as YYYYMMDD in KST (for race date comparison). */
function getTodayKstYyyymmdd(): string {
  const s = new Date().toLocaleString('en-CA', { timeZone: TZ }).slice(0, 10);
  return s.replace(/-/g, '');
}

/** Today's calendar date in KST (for header display and race-day check). */
export function getTodayKstDate(): { year: number; month: number; day: number; weekDay: number } {
  const ymd = getTodayKstYyyymmdd();
  const year = parseInt(ymd.slice(0, 4), 10);
  const month = parseInt(ymd.slice(4, 6), 10);
  const day = parseInt(ymd.slice(6, 8), 10);
  const noonKst = new Date(`${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}T12:00:00+09:00`);
  const weekDay = noonKst.getUTCDay();
  return { year, month, day, weekDay };
}

// ─── Date ───

/** Returns true if rcDate(YYYYMMDD) is before today (KST). Prefer isPastRaceDateTime when stTime is available. */
export function isPastRaceDate(rcDate: string | null | undefined): boolean {
  if (!rcDate || typeof rcDate !== 'string') return false;
  const norm = rcDate.replace(/-/g, '').slice(0, 8);
  if (norm.length < 8) return false;
  return norm < getTodayKstYyyymmdd();
}

/**
 * Returns true if race start (rcDate + stTime) is in the past. Use for "종료" vs "예정".
 * stTime format: "14:00" or "1400". If stTime is missing, falls back to date-only (isPastRaceDate).
 */
export function isPastRaceDateTime(
  rcDate: string | null | undefined,
  stTime?: string | null,
): boolean {
  if (!rcDate || typeof rcDate !== 'string') return false;
  const norm = rcDate.replace(/-/g, '').slice(0, 8);
  if (norm.length < 8) return false;
  if (stTime && typeof stTime === 'string') {
    const start = parseStTimeToDate(stTime, rcDate);
    if (start) return start.getTime() < Date.now();
  }
  return isPastRaceDate(rcDate);
}

/** Returns true if rcDate(YYYYMMDD) is today (KST). */
export function isTodayRcDate(rcDate: string | null | undefined): boolean {
  if (!rcDate || typeof rcDate !== 'string') return false;
  const norm = rcDate.replace(/-/g, '').slice(0, 8);
  if (norm.length < 8) return false;
  return norm === getTodayKstYyyymmdd();
}

/** YYYYMMDD or YYYY-MM-DD → "2025.02.15" */
export function formatRcDate(rcDate: string | undefined): string {
  if (!rcDate) return '-';
  const norm = rcDate.replace(/-/g, '');
  if (norm.length < 8) return rcDate;
  return `${norm.slice(0, 4)}.${norm.slice(4, 6)}.${norm.slice(6, 8)}`;
}

/**
 * Parse KRA stTime ("14:00" or "1400") with rcDate (YYYYMMDD) as KST.
 * Returns Date (UTC ms) so comparison with Date.now() is correct.
 */
export function parseStTimeToDate(
  stTime: string | null | undefined,
  rcDate: string | null | undefined,
): Date | null {
  if (!stTime || !rcDate || typeof stTime !== 'string' || typeof rcDate !== 'string') return null;
  const norm = rcDate.replace(/-/g, '').slice(0, 8);
  if (norm.length < 8) return null;
  const timeStr = stTime.trim().replace(':', '');
  const hour =
    timeStr.length >= 2 ? parseInt(timeStr.slice(0, 2), 10) : parseInt(timeStr, 10);
  const minute = timeStr.length >= 4 ? parseInt(timeStr.slice(2, 4), 10) : 0;
  if (Number.isNaN(hour) || hour < 0 || hour > 23) return null;
  const y = norm.slice(0, 4);
  const m = norm.slice(4, 6);
  const d = norm.slice(6, 8);
  const iso = `${y}-${m}-${d}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Minutes from now until race start (rcDate + stTime). Negative if already started.
 * Returns null if rcDate/stTime invalid.
 */
export function minutesUntilStart(
  rcDate: string | null | undefined,
  stTime: string | null | undefined,
): number | null {
  const start = parseStTimeToDate(stTime, rcDate);
  if (!start) return null;
  return Math.floor((start.getTime() - Date.now()) / 60_000);
}

/** Default buffer (minutes) after race start to consider race "ended" for display/KRA sync. */
const RACE_END_BUFFER_MINUTES = 20;

/**
 * Race end time (start + buffer). Used to decide "실제 종료" on frontend and when to sync results.
 * If no stTime, returns end of rcDate day in KST (23:59) so we don't treat as ended before the day is over.
 */
export function getRaceEndTime(
  rcDate: string | null | undefined,
  stTime: string | null | undefined,
  bufferMinutes: number = RACE_END_BUFFER_MINUTES,
): Date | null {
  if (!rcDate || typeof rcDate !== 'string') return null;
  const norm = rcDate.replace(/-/g, '').slice(0, 8);
  if (norm.length < 8) return null;
  const start = parseStTimeToDate(stTime, rcDate);
  if (start) {
    const end = new Date(start.getTime() + bufferMinutes * 60 * 1000);
    return end;
  }
  const endOfDayKst = new Date(
    `${norm.slice(0, 4)}-${norm.slice(4, 6)}-${norm.slice(6, 8)}T23:59:00+09:00`,
  );
  return endOfDayKst;
}

/**
 * True when race end time (start + buffer) is in the past. Use for client-side "종료" vs "예정".
 * Even if server returns COMPLETED, show as 예정/진행 until race end time has passed.
 */
export function isRaceActuallyEnded(
  rcDate: string | null | undefined,
  stTime?: string | null,
  bufferMinutes: number = RACE_END_BUFFER_MINUTES,
): boolean {
  const end = getRaceEndTime(rcDate, stTime, bufferMinutes);
  if (!end) return false;
  return end.getTime() < Date.now();
}

/**
 * Display status: show "종료" when race end time has passed (so ended races always show as 종료).
 * If server says COMPLETED but end time not yet passed, show 예정. Otherwise use server status.
 */
export function getDisplayRaceStatus(
  serverStatus: string | null | undefined,
  rcDate: string | null | undefined,
  stTime?: string | null,
): string {
  const s = (serverStatus ?? '').trim().toUpperCase();
  if (isRaceActuallyEnded(rcDate, stTime)) return 'COMPLETED';
  if (s === 'COMPLETED') return 'SCHEDULED';
  return s || '';
}

/** YYYYMMDD → "February 15" (month and day in Korean) */
export function formatRcDateShort(rcDate: string | undefined): string {
  if (!rcDate || rcDate.length < 8) return rcDate ?? '-';
  const m = parseInt(rcDate.slice(4, 6), 10);
  const d = parseInt(rcDate.slice(6, 8), 10);
  return `${m}월 ${d}일`;
}

// ─── Time ───

/** ISO or Date → "3:05 PM" (ko-KR AM/PM format) */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString(LOCALE, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: TZ,
    });
  } catch {
    return '-';
  }
}

/** ISO or Date → "2025. 2. 15. 3:05 PM" (ko-KR format) */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString(LOCALE, {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: TZ,
    });
  } catch {
    return '-';
  }
}

/** ISO or Date → "2025. 2. 15." */
export function formatDateOnly(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(LOCALE, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: TZ,
    });
  } catch {
    return '-';
  }
}

// ─── Numbers ───

/** Number → "1,234" (ko-KR thousand separator) */
export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '-';
  return n.toLocaleString(LOCALE);
}

/** Number → "1,234원" (Korean won) */
export function formatWon(n: number | null | undefined): string {
  if (n == null) return '-';
  return `${n.toLocaleString(LOCALE)}원`;
}

/** Number → "1,234pt" */
export function formatPoint(n: number | null | undefined): string {
  if (n == null) return '-';
  return `${n.toLocaleString(LOCALE)}pt`;
}
