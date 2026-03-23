/**
 * AI prediction scoring factor terminology — labels and tooltips
 * 15-factor scoring system (v4) used by Python analysis pipeline
 * @see docs/architecture/BUSINESS_LOGIC.md
 */

export interface FactorTerm {
  key: string;
  label: string;
  tooltip: string;
  /** Factor weight in scoring model (0–1, sums to 1.0) */
  weight: number;
}

/** All 15 scoring factors with Korean labels and descriptions */
export const FACTOR_TERMS: Record<string, FactorTerm> = {
  frm: {
    key: 'frm',
    label: '폼/기세',
    tooltip: '최근 5경기의 착순 추이와 레이팅 변화를 종합한 현재 경기력 지표입니다.',
    weight: 0.20,
  },
  rat: {
    key: 'rat',
    label: '레이팅',
    tooltip: 'KRA 공식 레이팅 점수. 출전마 간 상대 비교와 절대 구간 평가를 반영합니다.',
    weight: 0.17,
  },
  jky: {
    key: 'jky',
    label: '기수',
    tooltip: '기수의 해당 경마장 승률과 복승률을 반영한 점수입니다.',
    weight: 0.11,
  },
  cnd: {
    key: 'cnd',
    label: '컨디션',
    tooltip: '마체중 변화, 연령, 부담중량, 성별 등 당일 컨디션 요소입니다.',
    weight: 0.09,
  },
  suit: {
    key: 'suit',
    label: '적합도',
    tooltip: '각질(선행/추입)과 거리 매칭, 주로 상태(건조/습/불량) 적성입니다.',
    weight: 0.06,
  },
  trn: {
    key: 'trn',
    label: '조교사',
    tooltip: '조교사의 승률 및 복승률 보너스 점수입니다.',
    weight: 0.06,
  },
  gate: {
    key: 'gate',
    label: '게이트',
    tooltip: '출발 게이트 번호에 따른 유불리. 경마장·거리별로 내측/외측 바이어스가 다릅니다.',
    weight: 0.05,
  },
  exp: {
    key: 'exp',
    label: '경험',
    tooltip: '통산 출전 횟수와 승률 구간을 반영한 경험치 점수입니다.',
    weight: 0.05,
  },
  dist: {
    key: 'dist',
    label: '거리 성적',
    tooltip: '현재 경주와 같은 거리 구간에서의 승률과 복승률입니다.',
    weight: 0.05,
  },
  rest: {
    key: 'rest',
    label: '휴식',
    tooltip: '마지막 출전 이후 휴식 기간. 최적 21~42일, 너무 짧으면 피로, 길면 감각 저하.',
    weight: 0.04,
  },
  trng: {
    key: 'trng',
    label: '조교',
    tooltip: '최근 14일간 조교(훈련) 횟수, 강도, 빈도를 반영한 준비 상태입니다.',
    weight: 0.03,
  },
  cls: {
    key: 'cls',
    label: '클래스',
    tooltip: '등급 변경 영향. 하향(낮은 등급 출전) 시 유리, 상향 시 불리합니다.',
    weight: 0.03,
  },
  fsz: {
    key: 'fsz',
    label: '출전두수',
    tooltip: '소두수(적은 출전마)는 강자에게 유리, 다두수는 이변 가능성이 높아집니다.',
    weight: 0.02,
  },
  pace: {
    key: 'pace',
    label: '페이스',
    tooltip: '선행마 비율에 따른 오버페이스 확률. 선행마가 많으면 추입마에게 유리합니다.',
    weight: 0.02,
  },
  sdf: {
    key: 'sdf',
    label: '당일 피로',
    tooltip: '같은 날 이전 경주에 출전한 횟수에 따른 피로도 감점입니다.',
    weight: 0.02,
  },
};

/** Get factor term by key, returns null if not found */
export function getFactorTerm(key: string): FactorTerm | null {
  return FACTOR_TERMS[key] ?? null;
}

/** Get factor label (short name) for display */
export function getFactorLabel(key: string): string {
  return FACTOR_TERMS[key]?.label ?? key;
}

/** Ordered list of main sub-score keys shown in UI (matches PredictionHorseScore.sub) */
export const SUB_SCORE_KEYS = ['rat', 'frm', 'cnd', 'exp', 'trn', 'suit'] as const;

/** All 15 factor keys in weight-descending order */
export const ALL_FACTOR_KEYS = [
  'frm', 'rat', 'jky', 'cnd', 'suit', 'trn',
  'gate', 'exp', 'dist', 'rest', 'trng', 'cls',
  'fsz', 'pace', 'sdf',
] as const;
