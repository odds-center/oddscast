/**
 * 페이지 제목 — compact, row 형식
 * backHref 있으면: [뒤로가기 아이콘] [제목] — label 없음
 */
import Link from 'next/link';
import Icon from '../icons';

interface CompactPageTitleProps {
  title: string;
  /** 제목 왼쪽 뒤로가기 화살표 링크 */
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
      className={`flex flex-row items-center gap-2 sm:gap-3 mb-3 sm:mb-4 max-md:sticky max-md:top-0 max-md:z-10 max-md:bg-background/98 max-md:backdrop-blur-sm max-md:border-b max-md:border-border max-md:-mt-[max(1.25rem,env(safe-area-inset-top))] max-md:pt-[max(0.75rem,env(safe-area-inset-top))] max-md:pb-2.5 max-md:mb-3 ${className}`.trim()}
    >
      {backHref && (
        <Link
          href={backHref}
          className='flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 -ml-1 sm:-ml-2 shrink-0 text-foreground touch-manipulation rounded-xl hover:bg-primary/10 active:opacity-80'
          aria-label='뒤로'
        >
          <Icon name='ChevronLeft' size={24} />
        </Link>
      )}
      <h2 className='text-[15px] sm:text-base font-semibold text-foreground flex-1 min-w-0'>
        {title}
      </h2>
    </div>
  );
}
