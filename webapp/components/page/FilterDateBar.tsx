/**
 * 필터 칩 + 날짜 선택 공용 컴포넌트
 * 경주, 결과, 종합예상표 등에서 일관된 compact 스타일 적용
 */
import FilterChips from './FilterChips';

const dateInputClass =
  'h-9 px-2.5 rounded-lg text-sm border border-border bg-card text-foreground focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[120px] max-w-[150px] transition-all duration-200';

export interface FilterDateBarProps {
  /** 필터 옵션 (전체/오늘 등) */
  filterOptions: { value: string; label: string }[];
  /** 현재 필터 값 */
  filterValue: string;
  /** 필터 변경 */
  onFilterChange: (value: string) => void;
  /** 날짜 입력 표시 여부 */
  showDatePicker?: boolean;
  /** 날짜 입력 값 (필터가 날짜일 때만 표시) */
  dateValue?: string;
  /** 날짜 변경 */
  onDateChange?: (value: string) => void;
  /** 날짜 라벨 */
  dateLabel?: string;
  /** 고유 ID (한 페이지에 여러 개일 때) */
  dateId?: string;
  className?: string;
}

export default function FilterDateBar({
  filterOptions,
  filterValue,
  onFilterChange,
  showDatePicker = true,
  dateValue = '',
  onDateChange,
  dateLabel = '날짜',
  dateId = 'filter-date',
  className = '',
}: FilterDateBarProps) {
  return (
    <div className={`card p-3 mb-4 ${className}`.trim()}>
      <div className='flex flex-wrap gap-2 items-center'>
        <FilterChips
          options={filterOptions}
          value={filterValue}
          onChange={onFilterChange}
        />
        {showDatePicker && onDateChange && (
          <div className='flex items-center gap-1.5'>
            <label
              htmlFor={dateId}
              className='text-text-secondary text-xs font-medium shrink-0'
            >
              {dateLabel}
            </label>
            <input
              id={dateId}
              type='date'
              value={dateValue}
              onChange={(e) => onDateChange(e.target.value || '')}
              className={dateInputClass}
            />
          </div>
        )}
      </div>
    </div>
  );
}
