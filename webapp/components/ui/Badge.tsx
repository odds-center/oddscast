import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'muted' | 'success' | 'warning' | 'error';
  className?: string;
  size?: 'sm' | 'md';
}

const variantClass = {
  primary: 'bg-[rgba(22,163,74,0.07)] text-[#16a34a] border-[rgba(22,163,74,0.18)]',
  muted: 'bg-stone-50 text-stone-600 border-stone-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
};

const sizeClass = {
  sm: 'text-xs px-1.5 py-px rounded border',
  md: 'text-xs px-2 py-0.5 rounded border font-medium',
};

export default function Badge({ children, variant = 'primary', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center shrink-0 whitespace-nowrap ${variantClass[variant]} ${sizeClass[size]} ${className}`.trim()}>
      {children}
    </span>
  );
}
