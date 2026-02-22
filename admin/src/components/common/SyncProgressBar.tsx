interface SyncProgressBarProps {
  percent: number;
  message: string;
  className?: string;
}

/**
 * Progress bar + percentage and message for KRA sync operations.
 */
export default function SyncProgressBar({ percent, message, className = '' }: SyncProgressBarProps) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-gray-50 p-4 ${className}`}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{message}</span>
        <span className="tabular-nums text-gray-600">{Math.round(percent)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}
