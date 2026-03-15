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
  IN_PROGRESS: { label: '진행중', cls: 'bg-primary text-white border-primary' },
  in_progress: { label: '진행중', cls: 'bg-primary text-white border-primary' },
  RUNNING: { label: '진행중', cls: 'bg-primary text-white border-primary' },
  running: { label: '진행중', cls: 'bg-primary text-white border-primary' },
  COMPLETED: { label: '종료', cls: 'bg-stone-100 text-stone-500 border-stone-200' },
  completed: { label: '종료', cls: 'bg-stone-100 text-stone-500 border-stone-200' },
};

const DEFAULT = { label: '-', cls: 'bg-stone-50 text-stone-600 border-stone-200' };

export default function StatusBadge({ status, rcDate, stTime, className = '' }: StatusBadgeProps) {
  const effectiveStatus = getDisplayRaceStatus(status, rcDate, stTime);
  const base = STATUS_MAP[effectiveStatus] ?? DEFAULT;

  let label = base.label;
  let displayCls = base.cls;

  // "진행중": start time passed but results not in yet
  if (
    (effectiveStatus === 'SCHEDULED' || effectiveStatus === 'scheduled' || effectiveStatus === 'IN_PROGRESS' || effectiveStatus === 'in_progress') &&
    rcDate != null &&
    isPastRaceDateTime(rcDate, stTime) &&
    status !== 'CANCELLED' &&
    status !== 'cancelled'
  ) {
    label = '진행중';
    displayCls = STATUS_MAP.IN_PROGRESS.cls;
  }
  // "곧 시작" / "N분 후" for SCHEDULED today when start is within 30min
  else if (
    (effectiveStatus === 'SCHEDULED' || effectiveStatus === 'scheduled') &&
    isTodayRcDate(rcDate) &&
    stTime
  ) {
    const mins = minutesUntilStart(rcDate, stTime);
    if (mins != null && mins > 0 && mins <= 30) {
      label = mins <= 1 ? '곧 시작' : `${mins}분 후`;
      displayCls = 'bg-amber-50 text-amber-700 border-amber-300 font-bold';
    } else if (mins != null && mins > 30 && mins <= 120) {
      label = `${mins}분 후`;
    }
  }

  return (
    <span role="status" className={`inline-flex items-center text-xs px-2 py-0.5 rounded border font-semibold whitespace-nowrap ${displayCls} ${className}`.trim()}>
      {label}
    </span>
  );
}
