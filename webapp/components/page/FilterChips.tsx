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

export default function FilterChips({ options, value, onChange, className = '' }: FilterChipsProps) {
  return (
    <div className={`flex flex-wrap gap-1 ${className}`} role='group' aria-label='필터 옵션'>
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            type='button'
            aria-pressed={isActive}
            className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors touch-manipulation whitespace-nowrap ${
              isActive
                ? 'bg-[#292524] text-white'
                : 'bg-white border border-stone-200 text-stone-500 hover:text-stone-800 hover:border-stone-300'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
