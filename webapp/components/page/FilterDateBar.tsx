/**
 * Filter bar — integrated date (DatePicker) + status + location filters
 * Compact filter area in horse racing information site style
 */
import FilterChips from './FilterChips';
import DatePicker from '@/components/ui/DatePicker';

/** Location (racecourse) filter options: Seoul, Jeju, Busan */
export const MEET_FILTER_OPTIONS = [
  { value: '', label: '전체' },
  { value: '서울', label: '서울' },
  { value: '제주', label: '제주' },
  { value: '부산경남', label: '부산' },
] as const;

/** Race status filter options */
export const STATUS_FILTER_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'SCHEDULED', label: '예정' },
  { value: 'COMPLETED', label: '종료' },
] as const;

export interface FilterDateBarProps {
  filterOptions: { value: string; label: string }[];
  filterValue: string;
  onFilterChange: (value: string) => void;
  showDatePicker?: boolean;
  dateValue?: string;
  onDateChange?: (value: string) => void;
  dateLabel?: string;
  dateId?: string;
  showMeetFilter?: boolean;
  meetValue?: string;
  onMeetChange?: (value: string) => void;
  showStatusFilter?: boolean;
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  className?: string;
  inline?: boolean;
}

export default function FilterDateBar({
  filterOptions,
  filterValue,
  onFilterChange,
  showDatePicker = true,
  dateValue = '',
  onDateChange,
  dateId = 'filter-date',
  showMeetFilter = false,
  meetValue = '',
  onMeetChange,
  showStatusFilter = false,
  statusValue = '',
  onStatusChange,
  className = '',
  inline = false,
}: FilterDateBarProps) {
  const wrapClass = inline
    ? `flex flex-wrap gap-2 items-center mb-3 ${className}`.trim()
    : `rounded-lg border border-border bg-white px-3 py-2.5 mb-3 flex flex-wrap gap-2 items-center ${className}`.trim();

  return (
    <div className={wrapClass}>
      <FilterChips options={filterOptions} value={filterValue} onChange={onFilterChange} />

      {showDatePicker && onDateChange && (
        <DatePicker
          value={dateValue ?? ''}
          onChange={onDateChange}
          id={dateId}
          placeholder='날짜 선택'
        />
      )}

      {showStatusFilter && onStatusChange && (
        <>
          <span className='w-px h-5 bg-border mx-1 hidden sm:block' />
          <FilterChips
            options={[...STATUS_FILTER_OPTIONS]}
            value={statusValue ?? ''}
            onChange={onStatusChange}
          />
        </>
      )}

      {showMeetFilter && onMeetChange && (
        <>
          <span className='w-px h-5 bg-border mx-1 hidden sm:block' />
          <FilterChips
            options={[...MEET_FILTER_OPTIONS]}
            value={meetValue}
            onChange={onMeetChange}
          />
        </>
      )}
    </div>
  );
}
