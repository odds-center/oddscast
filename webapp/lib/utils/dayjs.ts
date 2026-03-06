/**
 * Shared dayjs instance with UTC and timezone plugins.
 * Import dayjs from this file in the webapp to ensure KST support.
 */
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const KST = 'Asia/Seoul';

/** Returns a dayjs object in KST timezone. */
export function dayjsKST(date?: dayjs.ConfigType): dayjs.Dayjs {
  return dayjs(date).tz(KST);
}

export default dayjs;
