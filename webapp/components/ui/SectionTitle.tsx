import Icon, { IconName } from '../icons';

interface SectionTitleProps {
  title: string;
  icon?: IconName;
  /** h3 vs h4 등 — 기본 h3 */
  as?: 'h2' | 'h3' | 'h4';
  className?: string;
  /** 아이콘 없이 제목만 */
  noIcon?: boolean;
}

const baseClass =
  'text-foreground font-bold flex items-center gap-2 border-b border-border';
const sizeClass = {
  h2: 'text-lg md:text-xl mb-4 pb-3',
  h3: 'text-base mb-4 pb-3',
  h4: 'text-sm mb-2 pb-2',
};

export default function SectionTitle({
  title,
  icon,
  as: Tag = 'h3',
  className = '',
  noIcon = false,
}: SectionTitleProps) {
  return (
    <Tag className={`${baseClass} ${sizeClass[Tag]} ${className}`.trim()}>
      {!noIcon && icon && (
        <span className='inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 shrink-0'>
          <Icon name={icon} size={20} className='text-primary' strokeWidth={2.5} />
        </span>
      )}
      {title}
    </Tag>
  );
}
