/**
 * KST (Asia/Seoul) date helpers using dayjs with timezone plugin.
 * Always use these functions for Korean business date logic.
 */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const KST = 'Asia/Seoul';

/** Returns a dayjs object in KST timezone. */
export function kst(date?: dayjs.ConfigType): dayjs.Dayjs {
  return dayjs(date).tz(KST);
}

/** Today in KST as YYYYMMDD (e.g. "20250301"). */
export function todayKstYyyymmdd(): string {
  return kst().format('YYYYMMDD');
}

/** Today in KST as YYYY-MM-DD (e.g. "2025-03-01"). */
export function todayKstDash(): string {
  return kst().format('YYYY-MM-DD');
}

/** A Date object converted to KST date string YYYY-MM-DD. */
export function dateToKstDash(d: Date): string {
  return kst(d).format('YYYY-MM-DD');
}

/** Yesterday in KST as YYYY-MM-DD. */
export function yesterdayKstDash(): string {
  return kst().subtract(1, 'day').format('YYYY-MM-DD');
}
