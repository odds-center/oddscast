/**
 * Tooltip — lightweight CSS-based tooltip
 * Displays description on hover/focus without external library
 */
import { type ReactNode } from 'react';

interface TooltipProps {
  /** Description text to display in tooltip */
  content: string;
  /** Child element to wrap */
  children: ReactNode;
  /** Tooltip position */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Inline wrapping (set to true when applied to th, span, etc.) */
  inline?: boolean;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  inline = false,
}: TooltipProps) {
  const positionClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-800 border-x-transparent border-b-transparent border-4',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 border-x-transparent border-t-transparent border-4',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-800 border-y-transparent border-r-transparent border-4',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-800 border-y-transparent border-l-transparent border-4',
  };

  const Tag = inline ? 'span' : 'div';

  return (
    <Tag className={`relative group/tooltip ${inline ? 'inline-flex items-center' : ''}`}>
      {children}
      <span className='cursor-help inline-flex items-center ml-0.5 text-text-tertiary opacity-60 group-hover/tooltip:opacity-100 transition-opacity'>
        <svg width='13' height='13' viewBox='0 0 16 16' fill='none' className='shrink-0'>
          <circle cx='8' cy='8' r='7' stroke='currentColor' strokeWidth='1.5' />
          <text x='8' y='12' textAnchor='middle' fill='currentColor' fontSize='10' fontWeight='600'>?</text>
        </svg>
      </span>
      <span
        role='tooltip'
        className={`
          pointer-events-none absolute z-50 ${positionClasses[position]}
          px-3 py-2 rounded-lg bg-stone-800 text-white text-xs leading-relaxed
          whitespace-nowrap shadow-lg
          opacity-0 scale-95 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100
          transition-all duration-150
        `}
      >
        {content}
        <span className={`absolute ${arrowClasses[position]}`} />
      </span>
    </Tag>
  );
}
