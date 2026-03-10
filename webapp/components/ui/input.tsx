import * as React from 'react';

import { cn } from '@/lib/utils/cn';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'min-h-[44px] w-full rounded-lg border border-input bg-transparent px-4 text-base text-foreground shadow-xs transition-[color,box-shadow] outline-none',
        'placeholder:text-muted-foreground',
        'focus:border-stone-400 focus:ring-2 focus:ring-gray-200',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
