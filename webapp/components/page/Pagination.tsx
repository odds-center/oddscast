/**
 * Pagination — < 1 ... 2 3 4 ... 5 > format
 * Can navigate directly to multiple pages
 */
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | 'ellipsis')[] = [];
  const showLeft = current > 3;
  const showRight = current < total - 2;

  pages.push(1);
  if (showLeft) pages.push('ellipsis');

  const start = showLeft ? Math.max(2, current - 1) : 2;
  const end = showRight ? Math.min(total - 1, current + 1) : total - 1;
  for (let i = start; i <= end; i++) pages.push(i);

  if (showRight) pages.push('ellipsis');
  if (total > 1) pages.push(total);

  return pages;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className={`flex justify-center items-center gap-1.5 flex-wrap ${className}`}>
      <Button
        variant='outline'
        size='sm'
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        aria-label='Previous page'
        className='min-w-[2.5rem]'
      >
        ‹
      </Button>

      {pageNumbers.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`ell-${i}`} className='px-1.5 text-text-tertiary'>
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size='sm'
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={`min-w-[2.5rem] ${
              p === page ? 'bg-stone-700 text-white border-stone-700 hover:bg-stone-800' : ''
            }`}
          >
            {p}
          </Button>
        ),
      )}

      <Button
        variant='outline'
        size='sm'
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        aria-label='Next page'
        className='min-w-[2.5rem]'
      >
        ›
      </Button>
    </div>
  );
}
