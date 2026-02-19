import Icon from './icons';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export default function LoadingSpinner({
  size = 24,
  className = '',
  label = '로딩 중...',
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-text-secondary ${className}`}>
      <Icon name='Loader2' size={size} className='animate-spin shrink-0 text-slate-500' />
      {label && <span className='text-[16px] text-text-secondary'>{label}</span>}
    </div>
  );
}
