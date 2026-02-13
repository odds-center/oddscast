/**
 * KRA API 기준 enum 및 변환 유틸
 * DB에는 KRA raw 값 저장, API 응답에는 enum으로 치환
 *
 * @see docs/specs/KRA_*.md, docs/legacy/KRA_OFFICIAL_GUIDE.md
 */

/** API 응답용 경마장 enum (DB: 서울/제주/부산경남 → API: SEOUL/JEJU/BUSAN) */
export enum Meet {
  SEOUL = 'SEOUL',
  JEJU = 'JEJU',
  BUSAN = 'BUSAN',
}

/** DB 값(KRA raw) → Meet enum */
const KRA_MEET_TO_ENUM: Record<string, Meet> = {
  서울: Meet.SEOUL,
  제주: Meet.JEJU,
  부산경남: Meet.BUSAN,
  부산: Meet.BUSAN,
  부경: Meet.BUSAN,
};

/** Meet enum → 표시용 라벨 */
export const MEET_LABELS: Record<Meet, string> = {
  [Meet.SEOUL]: '서울',
  [Meet.JEJU]: '제주',
  [Meet.BUSAN]: '부산경남',
};

/**
 * DB meet 값(KRA raw) → API 응답용 enum
 */
export function meetToEnum(dbMeet: string | null | undefined): Meet | null {
  if (dbMeet == null || dbMeet === '') return null;
  return KRA_MEET_TO_ENUM[dbMeet] ?? null;
}

/**
 * Meet enum → 표시 라벨
 */
export function meetToLabel(meet: Meet | null | undefined): string {
  if (meet == null) return '';
  return MEET_LABELS[meet] ?? String(meet);
}

/** enum/라벨 → DB 저장용 KRA 값 (요청 수신 시) */
const ENUM_TO_KRA: Record<string, string> = {
  [Meet.SEOUL]: '서울',
  [Meet.JEJU]: '제주',
  [Meet.BUSAN]: '부산경남',
  서울: '서울',
  제주: '제주',
  부산경남: '부산경남',
};

/**
 * API 요청값(enum 또는 한글) → DB 저장용 KRA 값
 */
export function toKraMeetForDb(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  return ENUM_TO_KRA[value] ?? value;
}
