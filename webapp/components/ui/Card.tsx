import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'hover' | 'accent';
  className?: string;
  as?: 'div' | 'section' | 'article';
}

const variantClass = {
  default: 'card',
  hover: 'card card-hover',
  accent: 'card card-accent',
};

export default function Card({ children, variant = 'default', className = '', as: Tag = 'div' }: CardProps) {
  return <Tag className={`${variantClass[variant]} ${className}`.trim()}>{children}</Tag>;
}
