import Link from 'next/link';
import Icon from '../icons';
import { ReactNode } from 'react';

interface LinkCardProps {
  href: string;
  children: ReactNode;
  className?: string;
  /** Show ChevronRight — default true */
  showChevron?: boolean;
}

export default function LinkCard({
  href,
  children,
  className = '',
  showChevron = true,
}: LinkCardProps) {
  return (
    <Link
      href={href}
      className={`card card-hover flex items-center justify-between gap-3 py-4 min-h-[48px] touch-manipulation ${className}`.trim()}
    >
      <div className='flex-1 min-w-0'>{children}</div>
      {showChevron && (
        <Icon name='ChevronRight' size={20} className='text-text-tertiary shrink-0' />
      )}
    </Link>
  );
}
