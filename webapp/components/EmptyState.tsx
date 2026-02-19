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
      className={`flex flex-col items-center justify-center p-12 lg:p-20 text-center rounded-xl border border-border bg-card ${className}`}
    >
      <div className='mb-6 p-5 rounded-xl bg-primary/12 border border-primary/25'>
        <Icon name={icon} size={48} className='text-primary' strokeWidth={2} />
      </div>
      <p className='font-display text-foreground font-bold text-xl sm:text-2xl leading-snug'>{title}</p>
      {description && <p className='text-text-secondary text-[16px] sm:text-base mt-3 max-w-md leading-relaxed'>{description}</p>}
      {action && <div className='mt-8'>{action}</div>}
    </div>
  );
}
