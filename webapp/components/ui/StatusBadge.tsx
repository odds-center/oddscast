import { isPastRaceDateTime, isTodayRcDate, minutesUntilStart } from '@/lib/utils/format';

interface StatusBadgeProps {
  status: string;
  rcDate?: string | null;
  stTime?: string | null;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  SCHEDULED: { label: '예정', cls: 'bg-white text-stone-600 border-stone-300' },
  scheduled: { label: '예정', cls: 'bg-white text-stone-600 border-stone-300' },
  IN_PROGRESS: { label: '진행', cls: 'bg-primary text-white border-primary' },
  in_progress: { label: '진행', cls: 'bg-primary text-white border-primary' },
  RUNNING: { label: '진행', cls: 'bg-primary text-white border-primary' },
  running: { label: '진행', cls: 'bg-primary text-white border-primary' },
  COMPLETED: { label: '종료', cls: 'bg-stone-100 text-stone-500 border-stone-200' },
  completed: { label: '종료', cls: 'bg-stone-100 text-stone-500 border-stone-200' },
};

const DEFAULT = { label: '-', cls: 'bg-stone-50 text-stone-400 border-stone-200' };

export default function StatusBadge({ status, rcDate, stTime, className = '' }: StatusBadgeProps) {
  const effectiveStatus =
    rcDate != null && isPastRaceDateTime(rcDate, stTime) && status !== 'CANCELLED' && status !== 'cancelled'
      ? 'COMPLETED'
      : status;
  const base = STATUS_MAP[effectiveStatus] ?? DEFAULT;

  // Live mode: show "N분 후" for SCHEDULED today when start is within 2 hours
  let label = base.label;
  if (
    (effectiveStatus === 'SCHEDULED' || effectiveStatus === 'scheduled') &&
    isTodayRcDate(rcDate) &&
    stTime
  ) {
    const mins = minutesUntilStart(rcDate, stTime);
    if (mins != null && mins > 0 && mins <= 120) {
      label = mins <= 1 ? '곧 시작' : `${mins}분 후`;
    }
  }

  return (
    <span className={`inline-flex items-center text-xs px-1.5 py-px rounded border font-medium whitespace-nowrap ${base.cls} ${className}`.trim()}>
      {label}
    </span>
  );
}
