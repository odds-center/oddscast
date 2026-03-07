/**
 * KRA API 기준 enum 및 변환 유틸
 * DB에는 KRA raw 값 저장, API 응답에는 enum으로 치환
 *
 * @see docs/specs/KRA_*.md
 */
/** API 응답용 경마장 enum (DB: 서울/제주/부산경남 → API: SEOUL/JEJU/BUSAN) */
export declare enum Meet {
    SEOUL = "SEOUL",
    JEJU = "JEJU",
    BUSAN = "BUSAN"
}
/** Meet enum → 표시용 라벨 */
export declare const MEET_LABELS: Record<Meet, string>;
/**
 * DB meet 값(KRA raw) → API 응답용 enum
 */
export declare function meetToEnum(dbMeet: string | null | undefined): Meet | null;
/**
 * Meet enum → 표시 라벨
 */
export declare function meetToLabel(meet: Meet | null | undefined): string;
/**
 * API 요청값(enum 또는 한글) → DB 저장용 KRA 값
 */
export declare function toKraMeetForDb(value: string | null | undefined): string | null;
//# sourceMappingURL=kra.types.d.ts.map