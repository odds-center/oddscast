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
  'inline-flex items-center justify-center px-3 py-2.5 sm:px-4 sm:py-2 min-h-[44px] sm:min-h-[40px] rounded-full text-sm font-medium transition-all duration-250 ease touch-manipulation';

export default function FilterChips({ options, value, onChange, className = '' }: FilterChipsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            type='button'
            className={`${chipBase} ${
              isActive
                ? 'bg-linear-to-r from-primary to-primary-dark text-primary-foreground shadow-[0_2px_8px_rgba(201,162,39,0.35)]'
                : 'bg-white/80 border border-border text-text-secondary hover:border-primary/40 hover:text-foreground hover:bg-primary/5 hover:shadow-sm'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
