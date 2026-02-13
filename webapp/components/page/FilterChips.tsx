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
  'inline-flex items-center justify-center px-4 py-2.5 min-h-[48px] rounded-xl text-base font-medium transition-all duration-200 touch-manipulation';

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
                ? 'bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(255,215,0,0.25)] border border-primary/30'
                : 'bg-card border border-border text-text-secondary hover:border-border-gold hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
