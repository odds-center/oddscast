import {
  isPastRaceDateTime,
  isTodayRcDate,
  minutesUntilStart,
  getDisplayRaceStatus,
} from '@/lib/utils/format';

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
  // Show "종료" only when server says COMPLETED and race end time has passed (client-side guard).
  const effectiveStatus = getDisplayRaceStatus(status, rcDate, stTime);
  const base = STATUS_MAP[effectiveStatus] ?? DEFAULT;

  // "진행": start time passed but results not in yet (still SCHEDULED/IN_PROGRESS)
  let label = base.label;
  let displayCls = base.cls;
  if (
    (effectiveStatus === 'SCHEDULED' || effectiveStatus === 'scheduled' || effectiveStatus === 'IN_PROGRESS' || effectiveStatus === 'in_progress') &&
    rcDate != null &&
    isPastRaceDateTime(rcDate, stTime) &&
    status !== 'CANCELLED' &&
    status !== 'cancelled'
  ) {
    label = '진행';
    displayCls = STATUS_MAP.IN_PROGRESS.cls;
  }
  // Live mode: show "N분 후" for SCHEDULED today when start is within 2 hours
  else if (
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
    <span className={`inline-flex items-center text-xs px-1.5 py-px rounded border font-medium whitespace-nowrap ${displayCls} ${className}`.trim()}>
      {label}
    </span>
  );
}
