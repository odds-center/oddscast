/**
 * KRA API 기준 상수 (docs/specs/KRA_*.md, docs/legacy/KRA_OFFICIAL_GUIDE.md)
 *
 * - meet 코드: API 요청 시 사용 (1:서울, 2:제주, 3:부산)
 * - meet 이름: API 응답 값 (경주결과·출전표 등에서 반환)
 */

export const KRA_MEET_CODE = {
  SEOUL: '1',
  JEJU: '2',
  BUSAN: '3',
} as const;

/** KRA API 응답의 meet 이름 (경주결과·출전표 표준) */
export const KRA_MEET_NAMES = {
  [KRA_MEET_CODE.SEOUL]: '서울',
  [KRA_MEET_CODE.JEJU]: '제주',
  [KRA_MEET_CODE.BUSAN]: '부산경남',
} as const;

export const KRA_MEETS = [
  { code: KRA_MEET_CODE.SEOUL, name: KRA_MEET_NAMES[KRA_MEET_CODE.SEOUL] },
  { code: KRA_MEET_CODE.JEJU, name: KRA_MEET_NAMES[KRA_MEET_CODE.JEJU] },
  { code: KRA_MEET_CODE.BUSAN, name: KRA_MEET_NAMES[KRA_MEET_CODE.BUSAN] },
] as const;

/** meet 이름/별칭/enum → KRA API 코드 (1,2,3) */
const MEET_TO_CODE: Record<string, string> = {
  서울: KRA_MEET_CODE.SEOUL,
  제주: KRA_MEET_CODE.JEJU,
  부산경남: KRA_MEET_CODE.BUSAN,
  부산: KRA_MEET_CODE.BUSAN,
  부경: KRA_MEET_CODE.BUSAN,
  Seoul: KRA_MEET_CODE.SEOUL,
  Jeju: KRA_MEET_CODE.JEJU,
  Busan: KRA_MEET_CODE.BUSAN,
  SEOUL: KRA_MEET_CODE.SEOUL,
  JEJU: KRA_MEET_CODE.JEJU,
  BUSAN: KRA_MEET_CODE.BUSAN,
};

/** meet 이름/코드 → KRA API 요청 코드 (1,2,3) */
export function meetToCode(meet: string): string {
  return (
    MEET_TO_CODE[meet] ?? (meet.match(/^[123]$/) ? meet : KRA_MEET_CODE.SEOUL)
  );
}

/** meet 이름/코드 → KRA API 응답값 (서울/제주/부산경남) */
export function toKraMeetName(meet: string): string {
  const code = meetToCode(meet);
  return (KRA_MEET_NAMES as Record<string, string>)[code] ?? meet;
}
