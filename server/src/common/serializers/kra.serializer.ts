/**
 * KRA DB 값 → API 응답 enum 치환
 * DB: KRA raw (서울, 제주, 부산경남) / API: enum (SEOUL, JEJU, BUSAN)
 *
 * 경주 종료: 실제 경주일+시각(rcDate+stTime)이 현재보다 과거일 때만 COMPLETED.
 * 시각 없으면 rcDate만 사용 (해당일 이전이면 종료).
 */
import dayjs from 'dayjs';
import { meetToEnum, meetToLabel } from '@oddscast/shared';

type RaceLike = {
  meet?: string | null;
  meetName?: string | null;
  rcDate?: string | null;
  stTime?: string | null;
  status?: string | null;
  [k: string]: unknown;
};
type ResultLike = { race?: RaceLike | null; [k: string]: unknown };

/**
 * 경주 시작일시(rcDate + stTime)가 현재보다 과거이면 true.
 * stTime 없으면 rcDate만 비교 (해당일이 오늘 이전이면 종료).
 * stTime 형식: "14:00" 또는 "1400"
 */
function isPastRaceDateTime(
  rcDate: string | null | undefined,
  stTime: string | null | undefined,
): boolean {
  if (!rcDate || typeof rcDate !== 'string') return false;
  const norm = rcDate.replace(/-/g, '').slice(0, 8);
  if (norm.length < 8) return false;
  const now = dayjs();
  if (stTime && typeof stTime === 'string') {
    const timeStr = stTime.trim().replace(':', '');
    const hour =
      timeStr.length >= 2 ? parseInt(timeStr.slice(0, 2), 10) : parseInt(timeStr, 10);
    const minute = timeStr.length >= 4 ? parseInt(timeStr.slice(2, 4), 10) : 0;
    if (!Number.isNaN(hour) && hour >= 0 && hour <= 23) {
      const raceStart = dayjs(norm, 'YYYYMMDD').hour(hour).minute(minute).second(0).millisecond(0);
      return raceStart.isBefore(now);
    }
  }
  return norm < now.format('YYYYMMDD');
}

/**
 * DB Race → API 응답 (meet을 enum으로 치환)
 * 실제 경주일시가 지난 경우에만 status COMPLETED로 override.
 * 미완료 경주는 results를 노출하지 않음 (실제 결과 없이 결과로 보이는 것 방지).
 */
export function serializeRace<T extends RaceLike>(race: T | null): T | null {
  if (!race) return null;
  const meetEnum = meetToEnum(race.meet);
  let status = race.status ?? race.raceStatus;
  if (isPastRaceDateTime(race.rcDate, race.stTime) && status !== 'CANCELLED') {
    status = 'COMPLETED';
  }
  const isCompleted = status === 'COMPLETED';
  const out: T = {
    ...race,
    meet: meetEnum ?? race.meet,
    meetName:
      meetEnum != null ? meetToLabel(meetEnum) : (race.meetName ?? race.meet),
    status,
    raceStatus: status,
  } as T;
  if (!isCompleted && Array.isArray((out as Record<string, unknown>).results)) {
    (out as Record<string, unknown>).results = [];
  }
  return out;
}

/**
 * Race 배열 serialize
 */
export function serializeRaces<T extends RaceLike>(races: T[]): T[] {
  return races.map((r) => serializeRace(r) as T);
}

/**
 * RaceResult (race 포함 시) → race.meet enum 치환
 */
export function serializeRaceResult<T extends ResultLike>(
  result: T | null,
): T | null {
  if (!result) return null;
  const race = result.race ? serializeRace(result.race) : result.race;
  return { ...result, race } as T;
}

/**
 * RaceResult 배열 serialize
 */
export function serializeRaceResults<T extends ResultLike>(results: T[]): T[] {
  return results.map((r) => serializeRaceResult(r) as T);
}

/** race 필드가 있는 객체 배열 serialize (picks, bets 등) */
export function serializeItemsWithRace<T extends { race?: RaceLike | null }>(
  items: T[],
): T[] {
  return items.map((item) =>
    item.race ? { ...item, race: serializeRace(item.race) } : item,
  ) as T[];
}
