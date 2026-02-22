/**
 * Page title — compact, row layout
 * If backHref provided: [back icon] [title] — no label
 */
import Link from 'next/link';
import Icon from '../icons';

interface CompactPageTitleProps {
  title: string;
  /** Back arrow link to the left of the title */
  backHref?: string;
  className?: string;
}

export default function CompactPageTitle({
  title,
  backHref,
  className = '',
}: CompactPageTitleProps) {
  return (
    <div
      className={`flex flex-row items-center gap-1 sm:gap-3 mb-4 sm:mb-5 max-md:sticky max-md:top-0 max-md:z-10 max-md:bg-background/98 max-md:backdrop-blur-sm max-md:border-b max-md:border-border max-md:-mt-[max(1.25rem,env(safe-area-inset-top))] max-md:pt-[max(0.75rem,env(safe-area-inset-top))] max-md:pb-3 max-md:mb-4 ${className}`.trim()}
    >
      {backHref && (
        <Link
          href={backHref}
          className='flex items-center justify-center w-11 h-11 -ml-1 shrink-0 text-foreground touch-manipulation rounded-xl hover:bg-stone-100 active:bg-stone-200 transition-colors'
          aria-label='뒤로'
        >
          <Icon name='ChevronLeft' size={22} />
        </Link>
      )}
      <h2 className='text-[17px] sm:text-lg font-bold text-foreground flex-1 min-w-0'>
        {title}
      </h2>
    </div>
  );
}
