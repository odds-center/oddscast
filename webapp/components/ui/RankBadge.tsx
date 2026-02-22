interface RankBadgeProps {
  rank: '1' | '2' | '3';
  className?: string;
}

const RANK_STYLES: Record<string, string> = {
  '1': 'bg-primary text-white border-primary-dark',
  '2': 'bg-stone-200 text-stone-700 border-stone-300',
  '3': 'bg-stone-100 text-stone-500 border-stone-200',
};

export default function RankBadge({ rank, className = '' }: RankBadgeProps) {
  const style = RANK_STYLES[rank] ?? 'badge-muted';
  return (
    <span className={`inline-flex items-center justify-center min-w-[24px] text-xs font-bold px-1.5 py-0.5 rounded border ${style} ${className}`.trim()}>
      {rank}
    </span>
  );
}
