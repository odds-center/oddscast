/**
 * SearchBar — debounced text input with search icon and clear button.
 * Designed for filtering races by horse name or jockey name.
 */
import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/icons';

interface SearchBarProps {
  /** Current search value (controlled, from URL state) */
  value: string;
  /** Called after 300ms debounce when input changes */
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = '말 이름 또는 기수 검색',
  className = '',
}: SearchBarProps) {
  // Local state tracks the raw input; debounced updates propagate via onChange
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when the external value changes (e.g., URL navigation)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setLocalValue(next);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(next);
    }, 300);
  }

  function handleClear() {
    setLocalValue('');
    if (timerRef.current) clearTimeout(timerRef.current);
    onChange('');
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Search icon */}
      <span className='pointer-events-none absolute left-3 text-text-tertiary'>
        <Icon name='Search' size={16} />
      </span>

      <input
        type='search'
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className='input-base w-full pl-9 pr-9 min-h-[44px]'
        aria-label={placeholder}
        autoComplete='off'
        autoCorrect='off'
        autoCapitalize='off'
        spellCheck={false}
      />

      {/* Clear button — only shown when input has value */}
      {localValue && (
        <button
          type='button'
          onClick={handleClear}
          aria-label='검색어 지우기'
          className='absolute right-2.5 flex items-center justify-center w-5 h-5 rounded-full text-text-tertiary hover:text-foreground hover:bg-stone-100 transition-colors'
        >
          <Icon name='X' size={14} />
        </button>
      )}
    </div>
  );
}
