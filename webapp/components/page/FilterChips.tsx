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
  'inline-flex items-center justify-center px-3 py-1.5 min-h-[36px] rounded-lg text-sm font-medium transition-all duration-200 ease touch-manipulation border';

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
                ? 'bg-primary text-primary-foreground border-primary/80'
                : 'bg-card border-border text-text-secondary hover:border-border-gold hover:text-foreground hover:bg-primary/5'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
