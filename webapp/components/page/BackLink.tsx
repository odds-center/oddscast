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
      className={`group inline-flex items-center gap-1.5 px-3 py-2 mt-6 text-stone-500 text-sm font-medium rounded-lg hover:text-stone-700 hover:bg-stone-100/80 active:bg-stone-200/60 active:scale-[0.98] transition-all touch-manipulation ${className}`}
    >
      <Icon name='ChevronLeft' size={16} strokeWidth={2.5} className='group-hover:-translate-x-0.5 transition-transform' />
      {label}
    </Link>
  );
}
