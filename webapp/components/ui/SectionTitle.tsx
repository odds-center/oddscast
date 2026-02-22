import Icon, { IconName } from '../icons';

interface SectionTitleProps {
  title: string;
  icon?: IconName;
  as?: 'h2' | 'h3' | 'h4';
  className?: string;
  noIcon?: boolean;
  badge?: string | number;
}

const sizeClass = {
  h2: 'text-sm mb-2 pb-1',
  h3: 'text-sm mb-1.5 pb-0.5',
  h4: 'text-sm mb-1 pb-0.5',
};

export default function SectionTitle({ title, icon, as: Tag = 'h3', className = '', noIcon = false, badge }: SectionTitleProps) {
  return (
    <Tag className={`text-foreground font-bold flex items-center gap-1 ${sizeClass[Tag]} ${className}`.trim()}>
      {!noIcon && icon && <Icon name={icon} size={14} className='text-primary shrink-0' strokeWidth={2} />}
      {title}
      {badge != null && badge !== '' && (
        <span className='text-xs font-medium text-primary ml-0.5'>{badge}</span>
      )}
    </Tag>
  );
}
