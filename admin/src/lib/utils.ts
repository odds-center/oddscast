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
