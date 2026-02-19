import Link from 'next/link';
import Icon from '../icons';
import { Card, SectionTitle } from '../ui';
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
    <Card as='section' variant={accent ? 'accent' : 'default'} className={className}>
      {title && (
        <div className='flex items-center justify-between gap-2 mb-2'>
          <div className='flex items-center gap-1.5 min-w-0'>
            <SectionTitle title={title} icon={icon} badge={badge} as='h3' className='mb-0 pb-0' />
            {description && (
              <span className='text-stone-400 text-xs hidden sm:inline whitespace-nowrap'>— {description}</span>
            )}
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className='inline-flex items-center gap-0.5 text-xs font-medium text-stone-400 hover:text-[#92702A] transition-colors shrink-0 whitespace-nowrap'
            >
              {viewAllLabel}
              <Icon name='ChevronRight' size={13} />
            </Link>
          )}
        </div>
      )}
      {children}
    </Card>
  );
}
