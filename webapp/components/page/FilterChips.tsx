import { Button } from '@/components/ui/button';

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
          <Button
            key={opt.value}
            variant={isActive ? 'default' : 'outline'}
            size='sm'
            onClick={() => onChange(opt.value)}
            type='button'
            aria-pressed={isActive}
            className={
              isActive
                ? 'bg-[#292524] border-[#292524] text-white hover:bg-[#292524]/90 text-xs px-2.5'
                : 'bg-white text-stone-500 hover:text-stone-800 text-xs px-2.5'
            }
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
