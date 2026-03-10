import * as React from 'react';

import { cn } from '@/lib/utils/cn';

interface CardProps extends React.ComponentProps<'div'> {
  as?: 'div' | 'section' | 'article';
  variant?: 'default' | 'hover' | 'accent';
}

function Card({ className, as: Tag = 'div', variant = 'default', ...props }: CardProps) {
  return (
    <Tag
      data-slot="card"
      className={cn(
        'rounded-[10px] border border-border bg-card p-4 md:px-5 md:py-[1.125rem] text-card-foreground',
        variant === 'hover' && 'cursor-pointer -webkit-tap-highlight-color-transparent hover:border-stone-300 active:bg-stone-50',
        variant === 'accent' && 'border-primary/20',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-1.5 pb-3', className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('', className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center pt-3', className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
