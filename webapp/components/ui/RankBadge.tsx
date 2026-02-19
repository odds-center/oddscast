interface RankBadgeProps {
  /** 1 | 2 | 3 — 순위 */
  rank: '1' | '2' | '3';
  className?: string;
}

const RANK_STYLES: Record<string, string> = {
  '1': 'bg-emerald-100 text-emerald-700 border-emerald-200', // 1등 (우승 강조)
  '2': 'bg-[#c0c0c5]/15 text-[#c0c0c5] border-[#c0c0c5]/30', // 은
  '3': 'bg-[#cd7f32]/15 text-[#cd7f32] border-[#cd7f32]/30', // 동
};

export default function RankBadge({ rank, className = '' }: RankBadgeProps) {
  const style = RANK_STYLES[rank] ?? 'badge-muted';
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[28px] text-[14px] font-bold px-2 py-1 rounded-lg border ${style} ${className}`.trim()}
    >
      {rank}
    </span>
  );
}
