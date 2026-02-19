import { isPastRaceDate } from '@/lib/utils/format';

interface StatusBadgeProps {
  status: string;
  rcDate?: string | null;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  SCHEDULED: { label: '예정', cls: 'bg-white text-stone-600 border-stone-300' },
  scheduled: { label: '예정', cls: 'bg-white text-stone-600 border-stone-300' },
  IN_PROGRESS: { label: '진행', cls: 'bg-[#92702A] text-white border-[#92702A]' },
  in_progress: { label: '진행', cls: 'bg-[#92702A] text-white border-[#92702A]' },
  RUNNING: { label: '진행', cls: 'bg-[#92702A] text-white border-[#92702A]' },
  running: { label: '진행', cls: 'bg-[#92702A] text-white border-[#92702A]' },
  COMPLETED: { label: '종료', cls: 'bg-stone-100 text-stone-500 border-stone-200' },
  completed: { label: '종료', cls: 'bg-stone-100 text-stone-500 border-stone-200' },
};

const DEFAULT = { label: '-', cls: 'bg-stone-50 text-stone-400 border-stone-200' };

export default function StatusBadge({ status, rcDate, className = '' }: StatusBadgeProps) {
  const effectiveStatus =
    rcDate != null && isPastRaceDate(rcDate) && status !== 'CANCELLED' && status !== 'cancelled'
      ? 'COMPLETED'
      : status;
  const { label, cls } = STATUS_MAP[effectiveStatus] ?? DEFAULT;
  return (
    <span className={`inline-flex items-center text-xs px-1.5 py-px rounded border font-medium whitespace-nowrap ${cls} ${className}`.trim()}>
      {label}
    </span>
  );
}
