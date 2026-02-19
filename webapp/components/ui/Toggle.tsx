'use client';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  'aria-label'?: string;
}

export default function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  'aria-label': ariaLabel,
}: ToggleProps) {
  return (
    <label
      className={`flex items-center gap-4 py-4 min-h-[56px] cursor-pointer select-none rounded-xl transition-colors ${
        disabled ? 'cursor-not-allowed opacity-70' : 'active:opacity-90 focus-within:bg-slate-100'
      }`}
    >
      <span className='relative inline-flex shrink-0'>
        <input
          type='checkbox'
          role='switch'
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          aria-label={ariaLabel ?? label}
          className='peer sr-only'
        />
        <span
          className={`block w-12 h-7 rounded-full transition-colors duration-200 ${
            checked ? 'bg-slate-600' : 'bg-border'
          }`}
        />
        <span
          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
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
