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
      className={`inline-flex items-center gap-2 mt-6 text-primary font-medium text-sm hover:text-primary/90 transition-colors touch-manipulation ${className}`}
    >
      <Icon name='ChevronLeft' size={18} strokeWidth={2.5} />
      {label}
    </Link>
  );
}
