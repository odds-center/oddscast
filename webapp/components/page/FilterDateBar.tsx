/**
 * 필터 바 — 날짜(DatePicker) + 상태 + 지역 필터 통합
 * 경마 정보 사이트 스타일의 컴팩트 필터 영역
 */
import FilterChips from './FilterChips';
import DatePicker from '@/components/ui/DatePicker';

/** 지역(경마장) 필터 옵션: 서울, 제주, 부산 */
export const MEET_FILTER_OPTIONS = [
  { value: '', label: '전체' },
  { value: '서울', label: '서울' },
  { value: '제주', label: '제주' },
  { value: '부산경남', label: '부산' },
] as const;

/** 경주 상태 필터 옵션 */
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
