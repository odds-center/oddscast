/**
 * 페이지네이션 — < 1 ... 2 3 4 ... 5 > 형식
 * 여러 페이지로 직접 이동 가능
 */
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const btnClass =
  'min-w-[2.5rem] min-h-[44px] sm:min-h-[36px] px-2.5 rounded-lg bg-card border border-border hover:border-border-gold disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2';
const pageBtnClass =
  'min-w-[2.5rem] min-h-[44px] sm:min-h-[36px] px-2.5 rounded-lg border font-medium text-sm transition-colors flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2';
const activeClass = 'bg-stone-700 text-white border-stone-700';
const inactiveClass = 'bg-card border-border hover:border-stone-300 hover:bg-stone-50';

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
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className={btnClass}
        aria-label='이전 페이지'
      >
        ‹
      </button>

      {pageNumbers.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`ell-${i}`} className='px-1.5 text-text-tertiary'>
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${pageBtnClass} ${p === page ? activeClass : inactiveClass}`}
            aria-label={`${p}페이지`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className={btnClass}
        aria-label='다음 페이지'
      >
        ›
      </button>
    </div>
  );
}
