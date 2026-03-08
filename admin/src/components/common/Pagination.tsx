import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminIcon } from '@/components/common/AdminIcon';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Total item count (enables offset range display) */
  total?: number;
  /** Items per page (default 20) */
  limit?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  total,
  limit = 20,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const maxVisiblePages = 5;

  let visiblePages = pages;
  if (totalPages > maxVisiblePages) {
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(currentPage - half, 1);
    const end = Math.min(start + maxVisiblePages - 1, totalPages);

    if (end - start < maxVisiblePages - 1) {
      start = Math.max(end - maxVisiblePages + 1, 1);
    }

    visiblePages = pages.slice(start - 1, end);
  }

  // Offset range: e.g. "1-20 / 156건"
  const rangeStart = total != null ? (currentPage - 1) * limit + 1 : null;
  const rangeEnd = total != null ? Math.min(currentPage * limit, total) : null;

  return (
    <div className='flex items-center justify-between border-t border-gray-200 bg-white px-4 py-1.5 sm:px-5'>
      {/* Mobile */}
      <div className='flex flex-1 justify-between sm:hidden'>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className='relative inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          이전
        </button>
        {total != null && rangeStart != null && rangeEnd != null ? (
          <span className='inline-flex items-center text-xs text-gray-500'>
            {rangeStart}-{rangeEnd} / {total}건
          </span>
        ) : (
          <span className='inline-flex items-center text-xs text-gray-500'>
            {currentPage} / {totalPages}
          </span>
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className='relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          다음
        </button>
      </div>

      {/* Desktop */}
      <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
        <div>
          {total != null && rangeStart != null && rangeEnd != null ? (
            <p className='text-xs text-gray-600'>
              <span className='font-medium'>{rangeStart}-{rangeEnd}</span>
              <span className='text-gray-400'> / </span>
              <span className='font-medium'>{total}</span>건
            </p>
          ) : (
            <p className='text-xs text-gray-600'>
              총 <span className='font-medium'>{totalPages}</span> 페이지 중{' '}
              <span className='font-medium'>{currentPage}</span> 페이지
            </p>
          )}
        </div>
        <div>
          <nav
            className='isolate inline-flex -space-x-px rounded-md shadow-sm'
            aria-label='Pagination'
          >
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className='relative inline-flex items-center rounded-l-md px-1.5 py-1 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <AdminIcon icon={ChevronLeft} className='h-4 w-4' />
            </button>
            {visiblePages.map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`relative inline-flex items-center px-3 py-1 text-xs font-semibold ${
                  page === currentPage
                    ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className='relative inline-flex items-center rounded-r-md px-1.5 py-1 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <AdminIcon icon={ChevronRight} className='h-4 w-4' />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
