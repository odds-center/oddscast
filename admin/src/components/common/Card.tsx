import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export default function Card({ children, className, title, description }: CardProps) {
  return (
    <div className={cn('bg-white shadow rounded-md', className)}>
      {(title || description) && (
        <div className='px-4 py-3 border-b border-gray-200'>
          {title && <h3 className='text-sm font-semibold text-gray-900'>{title}</h3>}
          {description && <p className='mt-0.5 text-sm text-gray-500'>{description}</p>}
        </div>
      )}
      <div className='px-4 py-3'>{children}</div>
    </div>
  );
}
