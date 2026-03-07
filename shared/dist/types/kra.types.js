"use strict";
/**
 * KRA API 기준 enum 및 변환 유틸
 * DB에는 KRA raw 값 저장, API 응답에는 enum으로 치환
 *
 * @see docs/specs/KRA_*.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEET_LABELS = exports.Meet = void 0;
exports.meetToEnum = meetToEnum;
exports.meetToLabel = meetToLabel;
exports.toKraMeetForDb = toKraMeetForDb;
/** API 응답용 경마장 enum (DB: 서울/제주/부산경남 → API: SEOUL/JEJU/BUSAN) */
var Meet;
(function (Meet) {
    Meet["SEOUL"] = "SEOUL";
    Meet["JEJU"] = "JEJU";
    Meet["BUSAN"] = "BUSAN";
})(Meet || (exports.Meet = Meet = {}));
/** DB 값(KRA raw) → Meet enum */
const KRA_MEET_TO_ENUM = {
    서울: Meet.SEOUL,
    제주: Meet.JEJU,
    부산경남: Meet.BUSAN,
    부산: Meet.BUSAN,
    부경: Meet.BUSAN,
};
/** Meet enum → 표시용 라벨 */
exports.MEET_LABELS = {
    [Meet.SEOUL]: '서울',
    [Meet.JEJU]: '제주',
    [Meet.BUSAN]: '부산경남',
};
/**
 * DB meet 값(KRA raw) → API 응답용 enum
 */
function meetToEnum(dbMeet) {
    if (dbMeet == null || dbMeet === '')
        return null;
    return KRA_MEET_TO_ENUM[dbMeet] ?? null;
}
/**
 * Meet enum → 표시 라벨
 */
function meetToLabel(meet) {
    if (meet == null)
        return '';
    return exports.MEET_LABELS[meet] ?? String(meet);
}
/** enum/라벨 → DB 저장용 KRA 값 (요청 수신 시) */
const ENUM_TO_KRA = {
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
function toKraMeetForDb(value) {
    if (value == null || value === '')
        return null;
    return ENUM_TO_KRA[value] ?? value;
}
