import { type ClassValue, clsx } from 'clsx';
import dayjs from 'dayjs';
import { isString } from 'es-toolkit';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return dayjs(date).format('YYYY.MM.DD');
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('YYYY.MM.DD HH:mm');
}

/** rcDate(YYYYMMDD)가 오늘 이전이면 true — 날짜 지난 경주는 종료로 간주 */
export function isPastRaceDate(rcDate: string | null | undefined): boolean {
  if (!rcDate || typeof rcDate !== 'string') return false;
  const norm = rcDate.replace(/-/g, '').slice(0, 8);
  if (norm.length < 8) return false;
  const today = dayjs().format('YYYYMMDD');
  return norm < today;
}

const RACE_END_BUFFER_MINUTES = 20;

/**
 * Parse race start time (rcDate + stTime) as KST Date. stTime: "10:30" or "1030".
 * Returns null if invalid.
 */
function parseRaceStartKst(
  rcDate: string | null | undefined,
  stTime: string | null | undefined,
): Date | null {
  if (!rcDate || typeof rcDate !== 'string') return null;
  const norm = rcDate.replace(/-/g, '').slice(0, 8);
  if (norm.length < 8) return null;
  if (!stTime || typeof stTime !== 'string') return null;
  const t = stTime.trim().replace(':', '');
  const hour = t.length >= 2 ? parseInt(t.slice(0, 2), 10) : parseInt(t, 10);
  const min = t.length >= 4 ? parseInt(t.slice(2, 4), 10) : 0;
  if (Number.isNaN(hour) || hour < 0 || hour > 23) return null;
  const iso = `${norm.slice(0, 4)}-${norm.slice(4, 6)}-${norm.slice(6, 8)}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00+09:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * True when race end time (start + buffer) is in the past. Align with WebApp: show "종료" only when actually ended.
 */
export function isRaceActuallyEnded(
  rcDate: string | null | undefined,
  stTime?: string | null,
  bufferMinutes: number = RACE_END_BUFFER_MINUTES,
): boolean {
  if (!rcDate || typeof rcDate !== 'string') return false;
  const norm = rcDate.replace(/-/g, '').slice(0, 8);
  if (norm.length < 8) return false;
  const start = parseRaceStartKst(rcDate, stTime ?? null);
  let endMs: number;
  if (start) {
    endMs = start.getTime() + bufferMinutes * 60 * 1000;
  } else {
    endMs = new Date(`${norm.slice(0, 4)}-${norm.slice(4, 6)}-${norm.slice(6, 8)}T23:59:00+09:00`).getTime();
  }
  return endMs < Date.now();
}

/**
 * Display status: show "COMPLETED" (종료) when race end time has passed so ended races always show as 종료.
 * If server says COMPLETED but end time not yet passed, show SCHEDULED. Otherwise use server status.
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

/** YYYYMMDD → YYYY-MM-DD */
export function formatYyyyMmDd(s: string): string {
  if (!isString(s) || s.length < 8) return s;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num);
}

/** 에러 메시지 추출 — any 대신 unknown 처리 (es-toolkit isString 활용) */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (isString(err)) return err;
  if (err && typeof err === 'object' && 'message' in err && isString((err as { message: unknown }).message)) {
    return (err as { message: string }).message;
  }
  return '알 수 없는 오류가 발생했습니다';
}
