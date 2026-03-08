/**
 * Tooltip — portal-rendered so it is not clipped by overflow
 * Min font size 14px for readability
 */
import { type ReactNode, useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  /** Description text to display in tooltip */
  content: string;
  /** Child element to wrap */
  children: ReactNode;
  /** Tooltip position */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Inline wrapping (set to true when applied to th, span, etc.) */
  inline?: boolean;
  /** When true, do not render the default "?" trigger icon (use when child is already an icon) */
  hideTriggerIcon?: boolean;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  inline = false,
  hideTriggerIcon = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const updatePosition = useCallback(() => {
    if (typeof document === 'undefined') return null;
    const el = triggerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    const style: React.CSSProperties = { position: 'fixed', zIndex: 9999 };
    if (position === 'top') {
      style.left = rect.left + rect.width / 2;
      style.top = rect.top;
      style.transform = 'translate(-50%, calc(-100% - 8px))';
    } else if (position === 'bottom') {
      style.left = rect.left + rect.width / 2;
      style.top = rect.bottom;
      style.transform = `translate(-50%, ${gap}px)`;
    } else if (position === 'left') {
      style.left = rect.left;
      style.top = rect.top + rect.height / 2;
      style.transform = `translate(calc(-100% - ${gap}px), -50%)`;
    } else {
      style.left = rect.right;
      style.top = rect.top + rect.height / 2;
      style.transform = `translate(${gap}px, -50%)`;
    }
    return style;
  }, [position]);

  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties | null>(null);
  useEffect(() => {
    if (!isVisible) {
      queueMicrotask(() => setTooltipStyle(null));
      return;
    }
    const id = requestAnimationFrame(() => {
      setTooltipStyle(updatePosition() ?? null);
    });
    return () => cancelAnimationFrame(id);
  }, [isVisible, updatePosition]);

  const Tag = inline ? 'span' : 'div';

  return (
    <>
      <Tag
        ref={(el) => { triggerRef.current = el; }}
        className={`relative group/tooltip ${inline ? 'inline-flex items-center' : ''}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
        {!hideTriggerIcon && (
          <span className='cursor-help inline-flex items-center ml-0.5 text-text-tertiary opacity-80 group-hover/tooltip:opacity-100 transition-opacity'>
            <svg width='16' height='16' viewBox='0 0 16 16' fill='none' className='shrink-0'>
              <circle cx='8' cy='8' r='7' stroke='currentColor' strokeWidth='1.5' />
              <text x='8' y='12' textAnchor='middle' fill='currentColor' fontSize='10' fontWeight='600'>?</text>
            </svg>
          </span>
        )}
      </Tag>
      {typeof document !== 'undefined' &&
        isVisible &&
        tooltipStyle &&
        createPortal(
          <span
            role='tooltip'
            className='px-3 py-2 rounded-lg bg-stone-800 text-white leading-relaxed whitespace-nowrap shadow-lg min-w-max'
            style={{
              ...tooltipStyle,
              fontSize: '14px',
              pointerEvents: 'none',
              opacity: 1,
            }}
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  );
}
