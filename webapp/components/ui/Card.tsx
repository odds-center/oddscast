import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  /** default | hover | accent */
  variant?: 'default' | 'hover' | 'accent';
  className?: string;
  as?: 'div' | 'section' | 'article';
}

const variantClass = {
  default: 'card',
  hover: 'card card-hover',
  accent: 'card border-l-[4px] border-l-slate-400',
};

export default function Card({
  children,
  variant = 'default',
  className = '',
  as: Tag = 'div',
}: CardProps) {
  return <Tag className={`${variantClass[variant]} ${className}`.trim()}>{children}</Tag>;
}
