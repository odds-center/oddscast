import Icon, { IconName } from '../icons';

interface PageHeaderProps {
  icon: IconName;
  title: string;
  description?: string;
  /** 추가 제목/부제 (예: 사용자명) */
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PageHeader({ icon, title, description, subtitle, children }: PageHeaderProps) {
  return (
    <div className='page-header'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4'>
        <div className='min-w-0 flex-1'>
          <h1 className='font-display text-lg sm:text-xl lg:text-2xl font-bold text-primary flex items-center gap-3 flex-wrap'>
            <span className='inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 border border-primary/20 shrink-0'>
              <Icon name={icon} size={22} className='text-primary' strokeWidth={2.5} />
            </span>
            <span className='truncate'>{title}</span>
          </h1>
          {subtitle && <div className='text-foreground font-medium mt-2'>{subtitle}</div>}
          {description && <p className='text-text-secondary text-sm mt-1.5 max-w-2xl leading-relaxed'>{description}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
