/**
 * DatePicker — shared date picker based on react-day-picker
 * Korean locale, horse racing style compact design
 */
import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { ko } from 'react-day-picker/locale';
import { format, parse, isValid } from 'date-fns';
import Icon from '@/components/icons';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = '날짜 선택',
  id,
  className = '',
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  const displayText = selected && isValid(selected)
    ? format(selected, 'yyyy.MM.dd')
    : '';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type='button'
        id={id}
        onClick={() => setOpen(!open)}
        className='inline-flex items-center gap-1.5 px-2.5 py-1.5 h-8 rounded-md text-sm border border-border bg-white text-foreground hover:border-stone-300 hover:bg-stone-50 transition-colors min-w-[120px]'
      >
        <Icon name='Calendar' size={14} className='text-text-tertiary shrink-0' />
        <span className={displayText ? 'text-foreground' : 'text-text-tertiary'}>
          {displayText || placeholder}
        </span>
      </button>
      {open && (
        <div className='absolute top-full mt-1 left-0 z-50 bg-white rounded-lg border border-border shadow-lg p-2'>
          <DayPicker
            mode='single'
            locale={ko}
            selected={selected}
            onSelect={(day) => {
              if (day) {
                onChange(format(day, 'yyyy-MM-dd'));
              } else {
                onChange('');
              }
              setOpen(false);
            }}
            classNames={{
              root: 'rdp-compact',
              month_caption: 'text-sm font-semibold text-foreground py-1',
              weekday: 'text-xs text-text-tertiary font-medium w-8 h-8',
              day_button: 'w-8 h-8 text-sm rounded-md hover:bg-stone-100 transition-colors',
              selected: 'bg-primary text-white font-semibold rounded-md',
              today: 'font-bold text-primary',
              chevron: 'text-text-secondary',
            }}
          />
          {value && (
            <button
              type='button'
              onClick={() => { onChange(''); setOpen(false); }}
              className='w-full text-center text-xs text-text-secondary hover:text-foreground py-1 mt-1 border-t border-border'
            >
              날짜 초기화
            </button>
          )}
        </div>
      )}
    </div>
  );
}
