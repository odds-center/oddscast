/**
 * KRA ord(착순) 값 파싱
 * - 숫자: 정상 착순 → ordInt 파싱, ordType null
 * - 낙마/실격/기권 등: 비정상 → ordType 설정, ordInt null
 * @see docs/specs/KRA_RACE_RESULT_SPEC.md
 * @see .cursor/plans/kra_db_스키마_및_예측_시스템_개선_e53141b6.plan.md §4.2
 */

export type OrdType = 'NORMAL' | 'FALL' | 'DQ' | 'WITHDRAWN';

/** KRA API 실제 ord 문자열 → ordType 매핑 (공식 문서·실제 응답 기준) */
const ORD_TYPE_MAP: Array<{ patterns: string[]; type: OrdType }> = [
  { patterns: ['낙', '낙마', '낙마(기권)'], type: 'FALL' },
  { patterns: ['실격', '실격(낙마)', '실격(기권)'], type: 'DQ' },
  { patterns: ['기권', '출전취소', '취소', '선제'], type: 'WITHDRAWN' },
];

/**
 * ord 문자열을 파싱하여 ordInt, ordType 반환
 * @param ordRaw KRA API ord 값 (숫자 또는 낙마/실격/기권 등)
 */
export function parseOrd(ordRaw: string | number | null | undefined): {
  ordInt: number | undefined;
  ordType: OrdType | null;
} {
  const s = ordRaw != null ? String(ordRaw).trim() : '';
  if (!s) return { ordInt: undefined, ordType: null };

  // 숫자만 (정상 착순)
  if (/^\d+$/.test(s)) {
    return { ordInt: parseInt(s, 10), ordType: null };
  }

  // 비숫자 → ordType 매핑
  const lower = s.toLowerCase();
  for (const { patterns, type } of ORD_TYPE_MAP) {
    if (patterns.some((p) => lower.includes(p))) {
      return { ordInt: undefined, ordType: type };
    }
  }

  // 매핑되지 않은 비숫자 (기타) → 후순위 처리용 DQ로 분류
  return { ordInt: undefined, ordType: 'DQ' };
}

/**
 * actualTop(정확도 계산용)에 포함할 ordType 여부
 * NORMAL 또는 null인 경우만 포함
 */
export function isEligibleForAccuracy(
  ordType: string | null | undefined,
): boolean {
  return ordType == null || ordType === 'NORMAL';
}
