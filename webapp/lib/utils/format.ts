/**
 * 표시용 포맷 유틸 — 날짜·시간·숫자 공용
 * 모든 시간 표시는 ko-KR 로케일 기준 (오전/오후)
 */

const LOCALE = 'ko-KR';
const TZ = 'Asia/Seoul';

// ─── 날짜 ───

/** rcDate(YYYYMMDD)가 오늘 이전이면 true — 날짜 지난 경주는 종료로 간주 */
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

/** YYYYMMDD 또는 YYYY-MM-DD → "2025.02.15" */
export function formatRcDate(rcDate: string | undefined): string {
  if (!rcDate) return '-';
  const norm = rcDate.replace(/-/g, '');
  if (norm.length < 8) return rcDate;
  return `${norm.slice(0, 4)}.${norm.slice(4, 6)}.${norm.slice(6, 8)}`;
}

/** YYYYMMDD → "2월 15일" */
export function formatRcDateShort(rcDate: string | undefined): string {
  if (!rcDate || rcDate.length < 8) return rcDate ?? '-';
  const m = parseInt(rcDate.slice(4, 6), 10);
  const d = parseInt(rcDate.slice(6, 8), 10);
  return `${m}월 ${d}일`;
}

// ─── 시간 ───

/** ISO 또는 Date → "오후 3:05" (ko-KR 오전/오후) */
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

/** ISO 또는 Date → "2025. 2. 15. 오후 3:05" */
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

/** ISO 또는 Date → "2025. 2. 15." */
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

// ─── 숫자 ───

/** 숫자 → "1,234" (ko-KR 천단위 콤마) */
export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '-';
  return n.toLocaleString(LOCALE);
}

/** 숫자 → "1,234원" */
export function formatWon(n: number | null | undefined): string {
  if (n == null) return '-';
  return `${n.toLocaleString(LOCALE)}원`;
}

/** 숫자 → "1,234pt" */
export function formatPoint(n: number | null | undefined): string {
  if (n == null) return '-';
  return `${n.toLocaleString(LOCALE)}pt`;
}
