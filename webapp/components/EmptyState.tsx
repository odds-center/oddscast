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
      className={`flex flex-col items-center justify-center p-10 lg:p-16 text-center rounded-2xl border border-border bg-card/60 backdrop-blur-sm ${className}`}
    >
      <div className='mb-5 p-4 rounded-2xl bg-primary/10 border border-primary/20'>
        <Icon name={icon} size={44} className='text-primary' strokeWidth={1.5} />
      </div>
      <p className='font-display text-foreground font-semibold text-xl'>{title}</p>
      {description && <p className='text-text-secondary text-sm mt-2 max-w-sm leading-relaxed'>{description}</p>}
      {action && <div className='mt-6'>{action}</div>}
    </div>
  );
}
