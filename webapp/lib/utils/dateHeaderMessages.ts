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

/** Shared copy when all today's races have ended (TodayRacesSection, races list). */
export const TODAY_ALL_ENDED_MESSAGE =
  '오늘 경기가 모두 종료되었습니다. 결과에서 순위와 배당을 확인하세요.';

/** Format next race day label into subtitle text. Label format: "금요일 (3/7)" */
export function formatNextRaceSubline(label: string): string {
  const match = label.match(/^(\S+요일)\s*\((\d+\/\d+)\)$/);
  const weekdayName = match ? match[1] : label;
  const datePart = match ? ` (${match[2]})` : '';
  return `다음 경기는 ${weekdayName}${datePart}에 있습니다`;
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
  // Today's races all ended — show results CTA + next race day info
  if (todayCount > 0 && todayAllEnded) {
    const subtitle = nextRaceDayLabel
      ? `결과를 확인하세요. ${formatNextRaceSubline(nextRaceDayLabel)}`
      : '결과에서 순위와 배당을 확인하세요.';
    return {
      title: '오늘 경기가 모두 종료되었습니다',
      subtitle,
      showTodayLink: true,
    };
  }

  // Today has races that are still upcoming or in progress
  if (todayCount > 0) {
    const titles = [
      '오늘 경주가 진행됩니다',
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

  // No races today — show next race day from DB
  if (nextRaceDayLabel) {
    return {
      title: '오늘은 경기가 없습니다',
      subtitle: formatNextRaceSubline(nextRaceDayLabel),
      showTodayLink: false,
    };
  }

  return {
    title: 'OddsCast',
    subtitle: '예정된 경주가 없습니다. 경마 정보·분석 서비스를 이용해 보세요.',
    showTodayLink: false,
  };
}

