import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const maxWidthClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  className,
  maxWidth = '2xl',
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-white rounded-md shadow-lg w-full mx-4 max-h-[90vh] overflow-y-auto',
          maxWidthClass[maxWidth],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex justify-between items-start p-4 border-b border-gray-200'>
          <h2 className='text-lg font-bold'>{title}</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 p-0.5'
            aria-label='닫기'
          >
            <X className='h-5 w-5' />
          </button>
        </div>
        <div className='p-4'>{children}</div>
      </div>
    </div>
  );
}
