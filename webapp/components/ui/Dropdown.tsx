'use client';

import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/icons';

export interface DropdownOption<T = string | number> {
  value: T;
  label: string;
}

interface DropdownProps<T = string | number> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function Dropdown<T extends string | number>({
  options,
  value,
  onChange,
  placeholder = '선택',
  label,
  disabled = false,
  className = '',
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayText = selected?.label ?? placeholder;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (opt: DropdownOption<T>) => {
    onChange(opt.value);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <label className='block text-sm font-medium text-foreground mb-2'>{label}</label>
      )}
      <button
        type='button'
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup='listbox'
        aria-expanded={open}
        className='dropdown-trigger w-full flex items-center justify-between gap-2 px-4 py-3 min-h-[48px] rounded-xl bg-card border border-border text-foreground text-base font-medium touch-manipulation transition-colors hover:border-border-gold focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed'
      >
        <span className='truncate'>{displayText}</span>
        <Icon
          name='ChevronDown'
          size={20}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role='listbox'
          className='dropdown-list absolute z-50 mt-2 w-full min-w-[120px] max-h-[240px] overflow-y-auto rounded-xl border border-border bg-card shadow-lg py-2'
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={String(opt.value)}
                role='option'
                aria-selected={isSelected}
                onClick={() => handleSelect(opt)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(opt);
                  }
                }}
                tabIndex={0}
                className={`dropdown-option flex items-center justify-between gap-2 px-4 py-3 cursor-pointer transition-colors touch-manipulation ${
                  isSelected
                    ? 'bg-primary/20 text-primary font-medium'
                    : 'text-foreground hover:bg-primary/10'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Icon name='Check' size={16} className='shrink-0 text-primary' />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
