import Link from 'next/link';
import Icon from '../icons';

interface BackLinkProps {
  href: string;
  label: string;
  className?: string;
}

export default function BackLink({ href, label, className = '' }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 py-1.5 mt-6 text-slate-700 font-medium text-sm hover:text-slate-900 hover:underline transition-colors touch-manipulation ${className}`}
    >
      <Icon name='ChevronLeft' size={18} strokeWidth={2.5} />
      {label}
    </Link>
  );
}
