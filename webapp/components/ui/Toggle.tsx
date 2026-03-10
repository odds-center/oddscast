/**
 * Toggle — wrapper around shadcn Switch with label/description support
 * Keeps the same checked/onChange API for backward compatibility
 */
import { Switch } from './switch';
import { cn } from '@/lib/utils/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  'aria-label'?: string;
  className?: string;
}

export default function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  'aria-label': ariaLabel,
  className,
}: ToggleProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-4 py-4 min-h-[56px] cursor-pointer select-none rounded-xl transition-colors',
        disabled ? 'cursor-not-allowed opacity-70' : 'active:opacity-90',
        className,
      )}
    >
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
      />
      {(label || description) && (
        <span className='flex-1 min-w-0'>
          {label && (
            <span className='block text-foreground font-medium text-base'>{label}</span>
          )}
          {description && (
            <span className='block text-text-secondary text-sm mt-0.5'>{description}</span>
          )}
        </span>
      )}
    </label>
  );
}
