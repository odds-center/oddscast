/**
 * Link within table/list
 */
import Link from 'next/link';
import Icon from '../icons';
import type { IconName } from '../icons';

interface LinkBadgeProps {
  href: string;
  children: React.ReactNode;
  icon?: IconName;
  iconSize?: number;
  className?: string;
}

export default function LinkBadge({ href, children, icon, iconSize = 12, className = '' }: LinkBadgeProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-[#92702A] hover:underline transition-colors whitespace-nowrap ${className}`.trim()}
    >
      {icon && <Icon name={icon} size={iconSize} strokeWidth={2} className='text-stone-400' />}
      {children}
    </Link>
  );
}
