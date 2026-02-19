import { isPastRaceDate } from '@/lib/utils/format';

interface StatusBadgeProps {
  status: string;
  /** rcDate 전달 시 날짜 지났으면 종료로 표시 (서버 응답 보완) */
  rcDate?: string | null;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'badge-muted', // 예정
  scheduled: 'badge-muted',
  IN_PROGRESS: 'badge-success', // 진행
  in_progress: 'badge-success',
  COMPLETED: 'badge-primary', // 종료
  completed: 'badge-primary',
  RUNNING: 'badge-success',
  running: 'badge-success',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: '예정',
  scheduled: '예정',
  IN_PROGRESS: '진행',
  in_progress: '진행',
  COMPLETED: '종료',
  completed: '종료',
  RUNNING: '진행',
  running: '진행',
};

const DEFAULT_STYLE = 'badge-muted';

export default function StatusBadge({ status, rcDate, className = '' }: StatusBadgeProps) {
  const effectiveStatus =
    rcDate != null && isPastRaceDate(rcDate) && status !== 'CANCELLED' && status !== 'cancelled'
      ? 'COMPLETED'
      : status;
  const style = STATUS_STYLES[effectiveStatus] ?? DEFAULT_STYLE;
  const label = (STATUS_LABELS[effectiveStatus] ?? effectiveStatus) || '-';
  return (
    <span
      className={`inline-flex items-center text-[14px] px-2.5 py-1 rounded-lg font-semibold shrink-0 border ${style} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
