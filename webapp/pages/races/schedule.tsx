/**
 * Race schedule dates — Annual calendar (12 months at a glance). Racecourse colors/legend + detailed plan summary
 * UI reference: KRA race schedule detailed plan and annual calendar
 */
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { serverGet } from '@/lib/api/serverFetch';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import DataFetchState from '@/components/page/DataFetchState';
import RaceApi, { type ScheduleDateItem } from '@/lib/api/raceApi';
import { routes } from '@/lib/routes';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import Icon from '@/components/icons';

/** Calendar cell */
type CalendarCell = { type: 'current'; day: number } | { type: 'other'; day: number };

/** Racecourse notation and sort order (matches calendar color mapping and legend) */
const MEET_ORDER = ['서울', '부산경남', '영천', '제주'] as const;
const MEET_LABEL: Record<string, string> = {
  서울: '서울',
  제주: '제주',
  부산경남: '부경',
  영천: '영천',
};

/** Single racecourse Tailwind background (for race day cells) */
const MEET_BG: Record<string, string> = {
  서울: 'bg-sky-200',
  부산경남: 'bg-amber-200',
  영천: 'bg-violet-200',
  제주: 'bg-red-200',
};

/** Sorted array of keys for racecourses with races from meetCounts */
function getMeetKeys(meetCounts: Record<string, number>): string[] {
  return MEET_ORDER.filter((k) => (meetCounts[k] ?? 0) > 0);
}

/**
 * Race day cell background: single racecourse=solid color, 2 or more=striped (gradient).
 * Returns: { className } or { style } (inline style for stripes)
 */
function getRaceDayStyle(meetCounts: Record<string, number>): { className?: string; style?: React.CSSProperties } {
  const keys = getMeetKeys(meetCounts);
  if (keys.length === 0) return {};
  if (keys.length === 1) {
    const c = MEET_BG[keys[0]];
    return c ? { className: c } : {};
  }
  // 2 or more: left→right stripes (Tailwind arbitrary gradient)
  const colors: string[] = [];
  if (keys.includes('서울')) colors.push('#7dd3fc');
  if (keys.includes('부산경남')) colors.push('#fde047');
  if (keys.includes('영천')) colors.push('#c4b5fd');
  if (keys.includes('제주')) colors.push('#fca5a5');
  if (colors.length === 0) return {};
  if (colors.length === 1) return { className: MEET_BG[keys[0]] };
  const step = 100 / colors.length;
  const stops = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`).join(', ');
  return {
    style: { background: `linear-gradient(to right, ${stops})` },
  };
}

function getYearRange(year: number): { dateFrom: string; dateTo: string } {
  return { dateFrom: `${year}0101`, dateTo: `${year}1231` };
}

function buildCalendarGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startOffset = first.getDay();
  const daysInMonth = last.getDate();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevLast = new Date(prevYear, prevMonth + 1, 0).getDate();
  const cells: CalendarCell[] = [];
  const total = 6 * 7;
  for (let i = 0; i < total; i++) {
    if (i < startOffset) {
      cells.push({ type: 'other', day: prevLast - startOffset + i + 1 });
    } else if (i < startOffset + daysInMonth) {
      cells.push({ type: 'current', day: i - startOffset + 1 });
    } else {
      cells.push({ type: 'other', day: i - startOffset - daysInMonth + 1 });
    }
  }
  return cells;
}

function getDateStrForCell(year: number, month: number, cellIndex: number): string {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startOffset = first.getDay();
  const daysInMonth = last.getDate();
  if (cellIndex < startOffset) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevLast = new Date(prevYear, prevMonth + 1, 0).getDate();
    const d = prevLast - startOffset + cellIndex + 1;
    return `${prevYear}${String(prevMonth + 1).padStart(2, '0')}${String(d).padStart(2, '0')}`;
  }
  if (cellIndex < startOffset + daysInMonth) {
    const d = cellIndex - startOffset + 1;
    return `${year}${String(month + 1).padStart(2, '0')}${String(d).padStart(2, '0')}`;
  }
  const d = cellIndex - startOffset - daysInMonth + 1;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  return `${nextYear}${String(nextMonth + 1).padStart(2, '0')}${String(d).padStart(2, '0')}`;
}

function formatMeetLabels(meetCounts: Record<string, number>): string {
  return getMeetKeys(meetCounts)
    .map((k) => MEET_LABEL[k] ?? k)
    .join(' · ');
}

/** YYYYMMDD → "M.D(day of week)" */
function formatDateShort(rcDate: string): string {
  if (rcDate.length < 8) return rcDate;
  const m = parseInt(rcDate.slice(4, 6), 10);
  const d = parseInt(rcDate.slice(6, 8), 10);
  const day = new Date(parseInt(rcDate.slice(0, 4), 10), m - 1, d).getDay();
  const wd = ['일', '월', '화', '수', '목', '금', '토'];
  return `${m}.${d}.(${wd[day]})`;
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

/** Legend item */
function LegendItem({
  label,
  className,
  style,
}: { label: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span className='flex items-center gap-1.5'>
      <span
        className={`inline-block w-3 h-3 rounded-sm shrink-0 ${className ?? ''}`}
        style={style}
      />
      <span className='text-xs text-stone-600'>{label}</span>
    </span>
  );
}

export default function RaceSchedulePage() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());

  useEffect(() => {
    const y = router.query?.year;
    if (y != null) {
      const yi = parseInt(String(y), 10);
      if (!Number.isNaN(yi) && yi >= 2000 && yi <= 2100) setYear(yi);
    }
  }, [router.query?.year]);

  const { dateFrom, dateTo } = useMemo(() => getYearRange(year), [year]);

  const { data: scheduleDates, isLoading, error, refetch } = useQuery({
    queryKey: ['races', 'schedule-dates', dateFrom, dateTo],
    queryFn: () => RaceApi.getScheduleDates({ dateFrom, dateTo }),
    enabled: !!dateFrom && !!dateTo,
    placeholderData: keepPreviousData,
  });

  const dateMap = useMemo(() => {
    const map = new Map<string, ScheduleDateItem>();
    if (!scheduleDates) return map;
    for (const item of scheduleDates) {
      const key = item.date.length === 8 ? item.date : item.date.replace(/-/g, '').slice(0, 8);
      map.set(key, item);
    }
    return map;
  }, [scheduleDates]);

  /** Execution period (first day, last day), number of execution days by racecourse */
  const { dateRangeText, meetDayCounts } = useMemo(() => {
    if (!scheduleDates || scheduleDates.length === 0) {
      return { dateRangeText: `${year}.1.1 ~ ${year}.12.31`, meetDayCounts: {} as Record<string, number> };
    }
    const sorted = [...scheduleDates].sort((a, b) => a.date.localeCompare(b.date));
    const first = formatDateShort(sorted[0].date);
    const last = formatDateShort(sorted[sorted.length - 1].date);
    const dateRangeText = `${year}. ${first} ~ ${last}`;
    const meetDayCounts: Record<string, number> = {};
    for (const item of scheduleDates) {
      for (const k of Object.keys(item.meetCounts)) {
        if ((item.meetCounts[k] ?? 0) > 0) meetDayCounts[k] = (meetDayCounts[k] ?? 0) + 1;
      }
    }
    return { dateRangeText, meetDayCounts };
  }, [scheduleDates, year]);

  const syncUrl = () => {
    router.replace({ pathname: router.pathname, query: { year } }, undefined, { shallow: true });
  };
  useEffect(() => {
    syncUrl();
  }, [year]);

  return (
    <Layout title='경마 시행일 | OddsCast'>
      <CompactPageTitle title='경마 시행일' backHref={routes.home} />
      <p className='text-text-tertiary text-xs mb-3 px-1'>
        경주가 있는 날을 누르면 해당 일자의 경주 목록으로 이동합니다. 한국마사회 경주계획표 기준으로 시행일이 표시됩니다.
      </p>

      {/* Year selection */}
      <div className='flex items-center gap-2 mb-4'>
        <button
          type='button'
          onClick={() => setYear((y) => y - 1)}
          className='p-1.5 rounded-lg text-stone-600 hover:bg-stone-100'
          aria-label='이전 해'
        >
          <Icon name='ChevronLeft' size={18} />
        </button>
        <span className='font-semibold text-foreground min-w-[72px] text-center'>{year}년</span>
        <button
          type='button'
          onClick={() => setYear((y) => y + 1)}
          className='p-1.5 rounded-lg text-stone-600 hover:bg-stone-100'
          aria-label='다음 해'
        >
          <Icon name='ChevronRight' size={18} />
        </button>
      </div>

      {/* Detailed plan summary information */}
      <div className='border border-stone-200 rounded-xl bg-stone-50/80 p-4 mb-4'>
        <h3 className='text-sm font-semibold text-stone-800 mb-2'>경마 시행 세부계획</h3>
        <div className='grid gap-3 text-xs'>
          <div>
            <span className='text-stone-500'>시행 기간 </span>
            <span className='text-foreground font-medium'>{dateRangeText}</span>
          </div>
          {Object.keys(meetDayCounts).length > 0 && (
            <div>
              <span className='text-stone-500 block mb-1'>경마장별 시행일 수</span>
              <div className='flex flex-wrap gap-x-4 gap-y-1'>
                {MEET_ORDER.filter((k) => (meetDayCounts[k] ?? 0) > 0).map((k) => (
                  <span key={k} className='text-foreground'>
                    {MEET_LABEL[k] ?? k} {(meetDayCounts[k] ?? 0)}일
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className='text-stone-500 pt-1 border-t border-stone-200'>
            요일별 기본 발매경주: 금 16R, 토 17R, 일 17R, 월 17R (참고)
          </div>
          {year === 2026 && (
            <div className='text-stone-500'>
              휴장일(참고): 설 2.20~2.22, 혹서기 7.31~8.2, 추석 9.25~9.27
            </div>
          )}
          <div className='text-stone-500 pt-1 border-t border-stone-200'>
            위 시행 기간·경마장별 일수는 한국마사회 경주계획표 기준입니다.
          </div>
        </div>
      </div>

      {/* Legend: Racecourse colors (same as calendar) */}
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2 mb-3 text-xs'>
        <LegendItem label='서울' className={MEET_BG['서울']} />
        <LegendItem label='부경' className={MEET_BG['부산경남']} />
        <LegendItem label='영천' className={MEET_BG['영천']} />
        <LegendItem label='제주' className={MEET_BG['제주']} />
        <LegendItem
          label='서울·제주'
          style={{ background: 'linear-gradient(to right, #7dd3fc 50%, #fca5a5 50%)' }}
        />
        <LegendItem
          label='영남·제주'
          style={{ background: 'linear-gradient(to right, #fde047 50%, #fca5a5 50%)' }}
        />
        <LegendItem
          label='서울·영남'
          style={{ background: 'linear-gradient(to right, #7dd3fc 50%, #fde047 50%)' }}
        />
      </div>

      <DataFetchState
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={() => refetch()}
        isEmpty={false}
        loadingLabel='시행일 준비 중...'
      >
        {scheduleDates !== undefined && scheduleDates.length === 0 && (
          <div className='mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900'>
            {year}년 경마 시행일이 아직 등록되지 않았습니다. 곧 업데이트될 예정이니 잠시 후 다시 확인해 주세요.
          </div>
        )}
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
          {MONTH_LABELS.map((monthLabel, monthIndex) => {
            const calendarCells = buildCalendarGrid(year, monthIndex);
            return (
              <div
                key={monthIndex}
                className='border border-stone-200 rounded-lg bg-white overflow-hidden'
              >
                <div className='py-1.5 px-2 border-b border-stone-100 bg-stone-50 text-center text-xs font-semibold text-stone-700'>
                  {monthLabel}
                </div>
                <div className='grid grid-cols-7 text-[10px] text-stone-500 border-b border-stone-100'>
                  {WEEKDAY_LABELS.map((label, i) => (
                    <div
                      key={label}
                      className={`py-0.5 text-center font-medium ${i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : ''}`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div className='grid grid-cols-7 [&>*:nth-child(7n)]:border-r-0'>
                  {calendarCells.map((cell, index) => {
                    const dateStr = getDateStrForCell(year, monthIndex, index);
                    const item = dateMap.get(dateStr);
                    const isCurrentMonth = cell.type === 'current';
                    const isToday =
                      isCurrentMonth &&
                      today.getFullYear() === year &&
                      today.getMonth() === monthIndex &&
                      today.getDate() === cell.day;
                    const hasRaces = !!item && item.totalRaces > 0;
                    const meetText = hasRaces && item ? formatMeetLabels(item.meetCounts) : '';
                    const raceStyle = hasRaces && item ? getRaceDayStyle(item.meetCounts) : {};

                    const content = (
                      <div
                        className={`
                          min-h-[36px] flex flex-col items-center justify-center py-0.5 px-0.5 text-[11px]
                          ${!isCurrentMonth ? 'text-stone-300' : ''}
                          ${isCurrentMonth && isToday ? 'font-bold text-primary' : ''}
                          ${isCurrentMonth && hasRaces ? 'text-foreground' : ''}
                          ${isCurrentMonth && !hasRaces ? 'text-stone-500' : ''}
                        `}
                      >
                        <span>{cell.day}</span>
                        {isCurrentMonth && hasRaces && meetText && (
                          <span className='text-[9px] mt-0.5 leading-tight truncate max-w-full text-stone-700' title={meetText}>
                            {meetText}
                          </span>
                        )}
                      </div>
                    );

                    const baseCellClass = 'border-b border-r border-stone-100';
                    const raceCellClass = hasRaces ? 'border-stone-200' : '';
                    const todayClass = isToday ? 'ring-1 ring-primary ring-inset' : '';

                    if (isCurrentMonth && hasRaces) {
                      const href = `${routes.races.list}?date=${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
                      return (
                        <Link
                          key={index}
                          href={href}
                          className={`hover:opacity-90 active:opacity-95 transition-opacity ${baseCellClass} ${raceCellClass} ${todayClass} ${raceStyle.className ?? ''}`}
                          style={raceStyle.style}
                        >
                          {content}
                        </Link>
                      );
                    }
                    return (
                      <div
                        key={index}
                        className={`${baseCellClass} ${todayClass}`}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DataFetchState>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const year = context.query?.year
    ? parseInt(String(context.query.year), 10)
    : new Date().getFullYear();
  const y = Number.isNaN(year) || year < 2000 || year > 2100 ? new Date().getFullYear() : year;
  const { dateFrom, dateTo } = getYearRange(y);

  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: ['races', 'schedule-dates', dateFrom, dateTo],
      queryFn: () =>
        serverGet<ScheduleDateItem[]>('/races/schedule-dates', {
          params: { dateFrom, dateTo },
        }),
    });
  } catch {
    // pass
  }
  return { props: { dehydratedState: dehydrate(queryClient) } };
};
