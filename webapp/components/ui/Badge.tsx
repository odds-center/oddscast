import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  /** primary | muted | success | warning | error */
  variant?: 'primary' | 'muted' | 'success' | 'warning' | 'error';
  className?: string;
  /** 크기 — sm은 더 작은 배지 */
  size?: 'sm' | 'md';
}

const variantClass = {
  primary: 'bg-primary/20 text-primary border-primary/30',
  muted: 'bg-secondary text-text-secondary border-border',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  error: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const sizeClass = {
  sm: 'text-xs px-1.5 py-0.5 rounded border',
  md: 'text-xs px-2.5 py-1 rounded-lg font-medium border',
};

export default function Badge({
  children,
  variant = 'primary',
  size = 'sm',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center shrink-0 ${variantClass[variant]} ${sizeClass[size]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
