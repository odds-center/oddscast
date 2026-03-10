import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all outline-none touch-action-manipulation -webkit-tap-highlight-color-transparent focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground border border-primary-dark hover:bg-primary-dark active:scale-[0.97] active:opacity-92',
        outline:
          'bg-white text-foreground border border-border font-medium hover:border-stone-300 hover:bg-stone-50 active:scale-[0.97] active:opacity-92',
        ghost: 'text-text-secondary font-medium hover:text-foreground transition-colors',
        destructive:
          'bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90 active:scale-[0.97]',
        link: 'text-primary underline-offset-4 hover:underline',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      },
      size: {
        default: 'min-h-[44px] px-4',
        sm: 'min-h-[36px] px-3 text-xs',
        lg: 'min-h-[48px] px-6',
        icon: 'size-10',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
