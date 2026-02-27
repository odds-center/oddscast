/**
 * KRA DB 값 → API 응답 enum 치환
 * DB: KRA raw (서울, 제주, 부산경남) / API: enum (SEOUL, JEJU, BUSAN)
 *
 * 날짜 지난 경기: rcDate < today 이면 status를 COMPLETED로 override
 * (결과 데이터 미수신 시에도 종료로 간주)
 */
import dayjs from 'dayjs';
import { meetToEnum, meetToLabel } from '@oddscast/shared';

type RaceLike = {
  meet?: string | null;
  meetName?: string | null;
  rcDate?: string | null;
  status?: string | null;
  [k: string]: unknown;
};
type ResultLike = { race?: RaceLike | null; [k: string]: unknown };

/** rcDate(YYYYMMDD 또는 YYYY-MM-DD)가 오늘 이전이면 true */
function isPastDate(rcDate: string | null | undefined): boolean {
  if (!rcDate || typeof rcDate !== 'string') return false;
  const norm = rcDate.replace(/-/g, '').slice(0, 8);
  if (norm.length < 8) return false;
  const today = dayjs().format('YYYYMMDD');
  return norm < today;
}

/**
 * DB Race → API 응답 (meet을 enum으로 치환)
 * 날짜 지난 경기는 status COMPLETED로 override.
 * 미완료 경주는 results를 노출하지 않음 (실제 결과 없이 결과로 보이는 것 방지).
 */
export function serializeRace<T extends RaceLike>(race: T | null): T | null {
  if (!race) return null;
  const meetEnum = meetToEnum(race.meet);
  let status = race.status ?? race.raceStatus;
  if (isPastDate(race.rcDate) && status !== 'CANCELLED') {
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
