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
      className={`flex flex-col items-center justify-center p-10 lg:p-16 text-center rounded-xl border border-border bg-card ${className}`}
    >
      <div className='mb-5 p-4 rounded-xl bg-primary/12 border border-primary/25'>
        <Icon name={icon} size={44} className='text-primary' strokeWidth={2} />
      </div>
      <p className='font-display text-foreground font-bold text-xl'>{title}</p>
      {description && <p className='text-text-secondary text-base mt-2 max-w-sm leading-relaxed'>{description}</p>}
      {action && <div className='mt-6'>{action}</div>}
    </div>
  );
}
