import Link from 'next/link';
import Icon from '../icons';
import { Card } from '../ui/card';
import SectionTitle from '../ui/SectionTitle';
import type { IconName } from '../icons';

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: IconName;
  accent?: boolean;
  className?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  badge?: string | number;
}

export default function SectionCard({
  children, title, description, icon, accent, className = '',
  viewAllHref, viewAllLabel = '더보기', badge,
}: SectionCardProps) {
  return (
    <Card
      as='section'
      variant={accent ? 'accent' : 'default'}
      className={className}
    >
      {title && (
        <div className='mb-3'>
          <div className='flex items-center justify-between gap-2'>
            <SectionTitle title={title} icon={icon} badge={badge} as='h3' className='mb-0 pb-0' />
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className='inline-flex items-center gap-0.5 text-sm font-medium text-stone-500 hover:text-primary active:text-primary transition-colors shrink-0 whitespace-nowrap touch-manipulation py-1'
              >
                {viewAllLabel}
                <Icon name='ChevronRight' size={14} />
              </Link>
            )}
          </div>
          {description && (
            <p className='text-stone-500 text-sm mt-1 leading-relaxed whitespace-pre-line'>{description}</p>
          )}
        </div>
      )}
      {children}
    </Card>
  );
}
