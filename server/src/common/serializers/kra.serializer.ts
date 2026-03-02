/**
 * KRA DB 값 → API 응답 enum 치환
 * DB: KRA raw (서울, 제주, 부산경남) / API: enum (SEOUL, JEJU, BUSAN)
 *
 * status는 DB 그대로 사용. COMPLETED는 결과 저장 시에만 설정됨(실제 경주 종료 후).
 * 미완료 경주는 results를 노출하지 않음.
 */
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
 * DB Race → API 응답 (meet을 enum으로 치환). 미완료 경주는 results를 노출하지 않음.
 */
export function serializeRace<T extends RaceLike>(race: T | null): T | null {
  if (!race) return null;
  const meetEnum = meetToEnum(race.meet);
  const status = race.status ?? race.raceStatus;
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
