import Link from 'next/link';
import Icon from '../icons';
import { Card, SectionTitle } from '../ui';
import type { IconName } from '../icons';

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  icon?: IconName;
  accent?: boolean;
  className?: string;
  /** 더보기 링크 */
  viewAllHref?: string;
  viewAllLabel?: string;
}

export default function SectionCard({
  children,
  title,
  icon,
  accent,
  className = '',
  viewAllHref,
  viewAllLabel = '전체보기',
}: SectionCardProps) {
  return (
    <Card as='section' variant={accent ? 'accent' : 'default'} className={className}>
      {title && (
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${viewAllHref ? 'mb-5' : 'mb-4'}`}>
          <SectionTitle title={title} icon={icon} as='h3' className={viewAllHref ? 'mb-0' : ''} />
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className='inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline transition-colors shrink-0'
            >
              {viewAllLabel}
              <Icon name='ChevronRight' size={16} />
            </Link>
          )}
        </div>
      )}
      {children}
    </Card>
  );
}
