/**
 * 예상 기호 — 코리아레이스 종합지 스타일
 * ◎(우수) ○(양호) △(복병) ※(주의) ★(인기)
 */
export type PredictionSymbolType = 'BEST' | 'GOOD' | 'DARK' | 'CAUTION' | 'POPULAR';

const SYMBOL_MAP: Record<PredictionSymbolType, { char: string; label: string; className: string }> = {
  BEST: { char: '◎', label: '우수', className: 'bg-emerald-500 text-white' },
  GOOD: { char: '○', label: '양호', className: 'bg-emerald-600 text-white' },
  DARK: { char: '△', label: '복병', className: 'bg-amber-500 text-white' },
  CAUTION: { char: '※', label: '주의', className: 'bg-slate-500 text-white' },
  POPULAR: { char: '★', label: '인기', className: 'bg-rose-500 text-white' },
};

export interface PredictionSymbolProps {
  type: PredictionSymbolType;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export default function PredictionSymbol({ type, size = 'md', showLabel = false }: PredictionSymbolProps) {
  const { char, label, className } = SYMBOL_MAP[type] ?? SYMBOL_MAP.CAUTION;
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold ${sizeClass} ${className}`}
      title={label}
    >
      {char}
      {showLabel && <span className='sr-only'>{label}</span>}
    </span>
  );
}

/** AI 점수 → 기호 매핑 (상위 4마) */
export function scoreToSymbol(rank: number): PredictionSymbolType {
  if (rank === 1) return 'BEST';
  if (rank === 2) return 'GOOD';
  if (rank === 3) return 'DARK';
  if (rank === 4) return 'CAUTION';
  return 'CAUTION';
}
