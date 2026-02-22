/**
 * Prediction symbol — ◎(excellent) ○(good) △(dark horse) ※(caution) ★(popular)
 */
export type PredictionSymbolType = 'BEST' | 'GOOD' | 'DARK' | 'CAUTION' | 'POPULAR';

const SYMBOL_MAP: Record<PredictionSymbolType, { char: string; label: string; className: string }> = {
  BEST: { char: '◎', label: '우수', className: 'bg-[#92702A] text-white' },
  GOOD: { char: '○', label: '양호', className: 'bg-[#7A5D1F] text-white' },
  DARK: { char: '△', label: '복병', className: 'bg-stone-500 text-white' },
  CAUTION: { char: '※', label: '주의', className: 'bg-stone-400 text-white' },
  POPULAR: { char: '★', label: '인기', className: 'bg-stone-700 text-white' },
};

export interface PredictionSymbolProps {
  type: PredictionSymbolType;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export default function PredictionSymbol({ type, size = 'md', showLabel = false }: PredictionSymbolProps) {
  const { char, label, className } = SYMBOL_MAP[type] ?? SYMBOL_MAP.CAUTION;
  const sizeClass = size === 'sm' ? 'w-5 h-5 text-xs' : 'w-7 h-7 text-sm';
  return (
    <span className={`inline-flex items-center justify-center rounded-full font-bold ${sizeClass} ${className}`} title={label}>
      {char}
      {showLabel && <span className='sr-only'>{label}</span>}
    </span>
  );
}

/** AI score → symbol mapping */
export function scoreToSymbol(rank: number): PredictionSymbolType {
  if (rank === 1) return 'BEST';
  if (rank === 2) return 'GOOD';
  if (rank === 3) return 'DARK';
  if (rank === 4) return 'CAUTION';
  return 'CAUTION';
}
