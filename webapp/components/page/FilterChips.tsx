interface ChipOption {
  value: string;
  label: string;
}

interface FilterChipsProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const chipBase =
  'inline-flex items-center justify-center px-3 py-2 sm:px-3.5 sm:py-1.5 min-h-[44px] sm:min-h-[36px] rounded-full text-sm font-medium transition-all duration-250 ease touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2';

export default function FilterChips({ options, value, onChange, className = '' }: FilterChipsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`} role='group' aria-label='필터 옵션'>
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            type='button'
            aria-pressed={isActive}
            aria-label={opt.label}
            className={`${chipBase} ${
              isActive
                ? 'bg-primary text-primary-foreground border border-primary-dark shadow-sm hover:bg-primary-dark'
                : 'bg-white/80 border border-border text-text-secondary hover:border-slate-300 hover:text-foreground hover:bg-slate-50 hover:shadow-sm'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
