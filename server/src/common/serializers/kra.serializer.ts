/**
 * KRA DB 값 → API 응답 enum 치환
 * DB: KRA raw (서울, 제주, 부산경남) / API: enum (SEOUL, JEJU, BUSAN)
 */
import { Meet, meetToEnum, meetToLabel } from '@goldenrace/shared';

type RaceLike = { meet?: string | null; meetName?: string | null; [k: string]: unknown };
type ResultLike = { race?: RaceLike | null; [k: string]: unknown };

/**
 * DB Race → API 응답 (meet을 enum으로 치환)
 */
export function serializeRace<T extends RaceLike>(race: T | null): T | null {
  if (!race) return null;
  const meetEnum = meetToEnum(race.meet);
  return {
    ...race,
    meet: meetEnum ?? race.meet,
    meetName: meetEnum != null ? meetToLabel(meetEnum) : (race.meetName ?? race.meet),
  } as T;
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
export function serializeRaceResult<T extends ResultLike>(result: T | null): T | null {
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
export function serializeItemsWithRace<T extends { race?: RaceLike | null }>(items: T[]): T[] {
  return items.map((item) =>
    item.race ? { ...item, race: serializeRace(item.race) } : item,
  ) as T[];
}
