/**
 * Format utilities for display — shared for dates, times, numbers.
 * All time operations use dayjs with KST (Asia/Seoul) timezone.
 */
import { dayjsKST, KST } from './dayjs';

const LOCALE = 'ko-KR';

// ─── KST date primitives ───

/** Today as YYYYMMDD in KST (for race date comparison). */
function getTodayKstYyyymmdd(): string {
  return dayjsKST().format('YYYYMMDD');
}

/** Today's calendar date in KST (for header display and race-day check). */
export function getTodayKstDate(): { year: number; month: number; day: number; weekDay: number } {
  const d = dayjsKST();
  return {
    year: d.year(),
    month: d.month() + 1, // dayjs months are 0-indexed
    day: d.date(),
    weekDay: d.day(), // 0=Sunday … 6=Saturday
  };
}

// ─── Date ───

/** Returns true if rcDate(YYYYMMDD) is before today (KST). */
export function isPastRaceDate(rcDate: string | null | undefined): boolean {
  if (!rcDate || typeof rcDate !== 'string') return false;
  const norm = rcDate.replace(/-/g, '').slice(0, 8);
  if (norm.length < 8) return false;
  return norm < getTodayKstYyyymmdd();
}

/**
 * Returns true if race start (rcDate + stTime) is in the past.
 * Falls back to date-only check if stTime is missing.
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

/** Korean racecourse name → display label */
export function formatMeet(meet: string): string {
  const map: Record<string, string> = { 서울: '서울', 제주: '제주', 부산경남: '부산·경남' };
  return map[meet] ?? meet;
}

// ─── Time parsing ───

/**
 * Parse KRA stTime ("14:00" or "1400") with rcDate (YYYYMMDD) as KST.
 * Returns a Date (UTC ms) so comparison with Date.now() is correct.
 */
export function parseStTimeToDate(
  stTime: string | null | undefined,
  rcDate: string | null | undefined,
): Date | null {
  if (!stTime || !rcDate || typeof stTime !== 'string' || typeof rcDate !== 'string') return null;
  const norm = rcDate.replace(/-/g, '').slice(0, 8);
  if (norm.length < 8) return null;
  // KRA stTime formats: "14:00", "1400", "출발 :14:00", "출발 :1400"
  const cleaned = stTime.trim().replace(/^[^\d]*/, '');
  const timeStr = cleaned.replace(/:/g, '');
  const hour =
    timeStr.length >= 2 ? parseInt(timeStr.slice(0, 2), 10) : parseInt(timeStr, 10);
  const minute = timeStr.length >= 4 ? parseInt(timeStr.slice(2, 4), 10) : 0;
  if (Number.isNaN(hour) || hour < 0 || hour > 23) return null;
  const d = dayjsKST(`${norm.slice(0, 4)}-${norm.slice(4, 6)}-${norm.slice(6, 8)}`)
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0);
  return d.isValid() ? d.toDate() : null;
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

/** Default buffer (minutes) after race start to consider race "ended". */
const RACE_END_BUFFER_MINUTES = 20;

/**
 * Race end time (start + buffer). Used to decide "실제 종료" on frontend.
 * If no stTime, returns end of rcDate day in KST (23:59).
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
    return new Date(start.getTime() + bufferMinutes * 60 * 1000);
  }
  return dayjsKST(`${norm.slice(0, 4)}-${norm.slice(4, 6)}-${norm.slice(6, 8)}`)
    .hour(23)
    .minute(59)
    .second(0)
    .toDate();
}

/** True when race end time (start + buffer) is in the past. */
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
 * Display status: show "종료" when race end time has passed.
 * If server says COMPLETED but end time not yet passed, show 예정.
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

// ─── Time display ───

/** ISO or Date → "오후 3:05" (ko-KR AM/PM format in KST) */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString(LOCALE, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: KST,
    });
  } catch {
    return '-';
  }
}

/** ISO or Date → "2025. 2. 15. 오후 3:05" (ko-KR short datetime in KST) */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString(LOCALE, {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: KST,
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
      timeZone: KST,
    });
  } catch {
    return '-';
  }
}

// ─── Race record formatting ───

/**
 * Format KRA race time (seconds as string or number) to M:SS.s display.
 * e.g. 72.3 → "1:12.3", "65" → "1:05.0"
 */
export function formatRaceTime(rcTime: string | number | null | undefined): string {
  if (rcTime == null || rcTime === '') return '-';
  const secs = typeof rcTime === 'number' ? rcTime : parseFloat(String(rcTime));
  if (!Number.isFinite(secs) || secs <= 0) return '-';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

/**
 * Convert KRA diffUnit gap text to a numeric decimal string.
 * Korean gap terms (목/머리/코) and fractions (1¼, 1/2) → numeric.
 * e.g. "목" → "0.3", "1¼" → "1.25", "1/2" → "0.5"
 */
export function formatDiffUnit(diff: string | null | undefined): string {
  if (!diff) return '-';
  const trimmed = diff.trim();
  if (!trimmed) return '-';
  if (/^\d+(\.\d+)?$/.test(trimmed)) return trimmed;

  const koreanGaps: Record<string, string> = { 코: '0.05', 머리: '0.2', 목: '0.3', 대: '10+' };
  if (koreanGaps[trimmed]) return koreanGaps[trimmed];

  const fractions: Record<string, number> = { '¼': 0.25, '½': 0.5, '¾': 0.75 };
  if (fractions[trimmed] != null) return String(fractions[trimmed]);

  const mixed = trimmed.match(/^(\d+)([¼½¾])$/);
  if (mixed) return String(parseInt(mixed[1], 10) + (fractions[mixed[2]] ?? 0));

  // slash fractions: "1/2", "3/4"
  const slashFrac = trimmed.match(/^(\d+)\/(\d+)$/);
  if (slashFrac) {
    const den = parseInt(slashFrac[2], 10);
    if (den > 0) return String(parseInt(slashFrac[1], 10) / den);
  }

  return trimmed;
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
