/**
 * 테이블/리스트 내 링크 배지 스타일 공용 컴포넌트
 * 경주 링크, 결과 링크 등에서 일관된 스타일
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

const linkBadgeClass =
  'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold hover:bg-slate-200 transition-colors';

export default function LinkBadge({
  href,
  children,
  icon,
  iconSize = 14,
  className = '',
}: LinkBadgeProps) {
  return (
    <Link href={href} className={`${linkBadgeClass} ${className}`.trim()}>
      {icon && <Icon name={icon} size={iconSize} strokeWidth={2} />}
      {children}
    </Link>
  );
}
