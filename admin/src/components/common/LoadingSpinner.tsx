import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /** 크기: sm(24px), md(40px), lg(64px) */
  size?: 'sm' | 'md' | 'lg';
  /** 추가 설명 텍스트 */
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

/**
 * Circular progress 로딩 스피너
 * SVG circle + stroke-dasharray 애니메이션으로 회전 효과
 */
export default function LoadingSpinner({ size = 'md', label, className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3', className)}
      role='status'
      aria-label={label ?? '로딩 중'}
    >
      <svg
        className={cn('animate-spin text-primary-600', sizeMap[size])}
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 24 24'
      >
        <circle
          className='opacity-25'
          cx='12'
          cy='12'
          r='10'
          stroke='currentColor'
          strokeWidth='4'
        />
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        />
      </svg>
      {label && <p className='text-sm text-gray-500'>{label}</p>}
    </div>
  );
}
