import * as React from 'react';

import { cn } from '@/lib/utils/cn';

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = React.useState(false);
  const [isScrolledEnd, setIsScrolledEnd] = React.useState(false);

  React.useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const check = () => {
      const hasOverflow = el.scrollWidth > el.clientWidth + 2;
      setCanScroll(hasOverflow);
      setIsScrolledEnd(hasOverflow && el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
    };

    check();
    el.addEventListener('scroll', check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', check);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={wrapperRef}
        data-slot="table-wrapper"
        className="relative w-full overflow-x-auto -webkit-overflow-scrolling-touch"
      >
        <table
          data-slot="table"
          className={cn('w-full caption-bottom text-sm', className)}
          {...props}
        />
      </div>
      {canScroll && !isScrolledEnd && (
        <div
          className="pointer-events-none absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/90 to-transparent"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('bg-stone-50 border-b border-stone-300 [&_tr]:border-b', className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-b border-stone-100 transition-colors hover:bg-stone-50/50 data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'px-2.5 py-2 text-left align-middle text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'px-2.5 py-2 align-middle text-sm whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
