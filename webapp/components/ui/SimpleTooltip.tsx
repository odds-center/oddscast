/**
 * Backward-compatible tooltip wrapper around shadcn Tooltip
 * Supports the same API as the old custom Tooltip component:
 * <SimpleTooltip content="text" inline>trigger</SimpleTooltip>
 */
import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip';

interface SimpleTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  inline?: boolean;
  hideTriggerIcon?: boolean;
  className?: string;
}

export default function SimpleTooltip({
  content,
  children,
  position = 'top',
  inline,
  hideTriggerIcon,
  className = '',
}: SimpleTooltipProps) {
  if (!content) return <>{children}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild={!!inline} className={className}>
        {inline ? (
          <span className='inline-flex items-center gap-0.5'>
            {children}
            {!hideTriggerIcon && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                className="text-text-tertiary shrink-0"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <text
                  x="8"
                  y="11.5"
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="10"
                  fontWeight="600"
                >
                  ?
                </text>
              </svg>
            )}
          </span>
        ) : (
          <span>{children}</span>
        )}
      </TooltipTrigger>
      <TooltipContent side={position} sideOffset={4}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
