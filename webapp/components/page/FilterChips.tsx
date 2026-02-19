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
  'inline-flex items-center justify-center px-3 py-2 sm:px-3.5 sm:py-1.5 min-h-[36px] rounded-full text-sm font-medium transition-all duration-250 ease touch-manipulation';

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
                ? 'bg-slate-700 text-white shadow-sm'
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
