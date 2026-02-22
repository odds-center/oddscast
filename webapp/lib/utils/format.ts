/**
 * Format utilities for display — shared for dates, times, numbers
 * All time displays use ko-KR locale (AM/PM)
 */

const LOCALE = 'ko-KR';
const TZ = 'Asia/Seoul';

// ─── Date ───

/** Returns true if rcDate(YYYYMMDD) is before today — past race dates are considered finished */
export function isPastRaceDate(rcDate: string | null | undefined): boolean {
  if (!rcDate || typeof rcDate !== 'string') return false;
  const norm = rcDate.replace(/-/g, '').slice(0, 8);
  if (norm.length < 8) return false;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return norm < `${y}${m}${d}`;
}

/** YYYYMMDD or YYYY-MM-DD → "2025.02.15" */
export function formatRcDate(rcDate: string | undefined): string {
  if (!rcDate) return '-';
  const norm = rcDate.replace(/-/g, '');
  if (norm.length < 8) return rcDate;
  return `${norm.slice(0, 4)}.${norm.slice(4, 6)}.${norm.slice(6, 8)}`;
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
