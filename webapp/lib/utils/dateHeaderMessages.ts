/**
 * Date header copy — today vs no races, next race day.
 * Used by home hero (DateHeader) for context-aware messaging.
 */

export interface DateHeaderMessage {
  title: string;
  subtitle: string;
  /** Whether to show "오늘의 경주" CTA */
  showTodayLink: boolean;
}

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** Shared copy when all today's races have ended (DateHeader, TodayRacesSection, races list). */
export const TODAY_ALL_ENDED_MESSAGE =
  '오늘 경기가 모두 종료되었습니다. 결과에서 순위와 배당을 확인하세요.';

/** Next race day label for subtitle, e.g. "금요일 (2/28)" → "금요일에 만나요" */
export function formatNextRaceSubline(weekdayName: string, datePart: string): string {
  const dayOnly = weekdayName.replace('요일', '').trim();
  const variants = [
    `다음 경기는 ${dayOnly}요일에 만나요`,
    `다음 경기일은 ${dayOnly}요일입니다`,
    `${dayOnly}요일에 다음 경주가 있습니다`,
  ];
  const idx = typeof datePart === 'string' && datePart.length > 0
    ? datePart.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % variants.length
    : 0;
  return variants[idx];
}

/**
 * Returns title, subtitle, and whether to show "오늘의 경주" link
 * based on actual today race count, next race day, and whether all today's races have ended.
 */
export function getDateHeaderMessage(
  todayCount: number,
  nextRaceDayLabel: string | null,
  todayAllEnded?: boolean,
): DateHeaderMessage {
  if (todayCount > 0) {
    if (todayAllEnded) {
      return {
        title: '오늘 경기가 모두 종료되었습니다',
        subtitle: '결과에서 순위와 배당을 확인하세요.',
        showTodayLink: true,
      };
    }
    const titles = [
      '오늘 경주가 진행됩니다',
      '오늘의 경주가 열렸습니다',
      todayCount <= 1 ? '오늘 경주가 진행됩니다' : `오늘 ${todayCount}경이 진행됩니다`,
    ];
    const title = titles[todayCount % titles.length] ?? titles[0];
    const subtitles = [
      'AI 분석으로 경주를 예측해보세요',
      todayCount > 1 ? `오늘 ${todayCount}경, 발매정보를 확인하세요` : 'AI 분석으로 경주를 예측해보세요',
      '경주 목록에서 상세 정보를 확인하세요',
    ];
    const subtitle = subtitles[todayCount % subtitles.length] ?? subtitles[0];
    return { title, subtitle, showTodayLink: true };
  }

  if (nextRaceDayLabel) {
    const match = nextRaceDayLabel.match(/^(\S+요일)\s*\((\d+\/\d+)\)$/);
    const weekdayName = match ? match[1] : nextRaceDayLabel;
    const datePart = match ? match[2] : '';
    const subtitle = formatNextRaceSubline(weekdayName, datePart);
    const titles = [
      '금일 경주는 없습니다',
      '오늘은 경기가 없습니다',
      'OddsCast',
    ];
    const title = titles[datePart.length % titles.length] ?? titles[0];
    return { title, subtitle, showTodayLink: false };
  }

  return {
    title: 'OddsCast',
    subtitle: '금일 경주는 없습니다. 경마 정보·분석 서비스를 이용해 보세요.',
    showTodayLink: false,
  };
}

export function getNextRaceDayLabel(raceDays: number[], fromDate: Date): string | null {
  const weekDays = WEEKDAY_NAMES;
  const d = new Date(fromDate);
  for (let i = 1; i <= 7; i++) {
    d.setDate(fromDate.getDate() + i);
    if (raceDays.includes(d.getDay())) {
      const month = d.getMonth() + 1;
      const day = d.getDate();
      return `${weekDays[d.getDay()]}요일 (${month}/${day})`;
    }
  }
  return null;
}
