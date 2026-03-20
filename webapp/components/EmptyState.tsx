import Icon, { IconName } from './icons';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon = 'ClipboardList',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 lg:p-12 text-center rounded-xl border border-border bg-card ${className}`}
    >
      <div className='mb-4 p-3 rounded-lg bg-stone-50 border border-stone-200'>
        <Icon name={icon} size={28} className='text-stone-400' strokeWidth={2} />
      </div>
      <p className='font-display text-foreground font-bold text-xl sm:text-2xl leading-snug'>{title}</p>
      {description && <p className='text-text-secondary text-[16px] sm:text-base mt-3 max-w-md leading-relaxed whitespace-pre-line'>{description}</p>}
      {action && <div className='mt-8'>{action}</div>}
    </div>
  );
}
