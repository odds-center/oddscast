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
          <h1 className='font-display text-xl sm:text-2xl lg:text-[1.625rem] font-bold flex items-center gap-3 flex-wrap'>
            <span className='inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-100 border border-slate-200 shrink-0'>
              <Icon name={icon} size={24} className='text-slate-600' strokeWidth={2.5} />
            </span>
            <span className='text-foreground truncate'>{title}</span>
          </h1>
          {subtitle && <div className='text-foreground font-semibold mt-2 text-base'>{subtitle}</div>}
          {description && <p className='text-text-secondary text-base mt-2 max-w-2xl leading-relaxed'>{description}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
