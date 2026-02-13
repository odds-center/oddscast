interface PaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}

const btnClass = 'px-5 py-2.5 rounded-lg bg-card border border-border hover:border-border-gold disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors';

export default function Pagination({ page, totalPages, onPrev, onNext, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex justify-center items-center gap-3 ${className}`}>
      <button onClick={onPrev} disabled={page <= 1} className={btnClass}>
        이전
      </button>
      <span className='text-text-secondary text-sm'>
        {page} / {totalPages}
      </span>
      <button onClick={onNext} disabled={page >= totalPages} className={btnClass}>
        다음
      </button>
    </div>
  );
}
