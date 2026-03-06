/**
 * Home hero banner — KRA style dark banner
 * Copy varies by today's race count and next race day.
 * On race days, shows countdown to next race when available.
 */
import Icon from '@/components/icons';
import Link from 'next/link';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import RaceApi from '@/lib/api/raceApi';
import { routes } from '@/lib/routes';
import { getDateHeaderMessage } from '@/lib/utils/dateHeaderMessages';
import { parseStTimeToDate, isTodayRcDate, getTodayKstDate, isRaceActuallyEnded } from '@/lib/utils/format';

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const COUNTDOWN_TICK_MS = 60 * 1000; // 1 min

type RaceWithTime = {
  rcDate?: string;
  stTime?: string;
  rcNo?: string;
  status?: string;
  raceStatus?: string;
};

function getNextRaceMinutes(races: RaceWithTime[]): number | null {
  const nowMs = Date.now();
  let nextStart: number | null = null;
  for (const r of races) {
    if (!r.rcDate || !r.stTime || !isTodayRcDate(r.rcDate)) continue;
    const start = parseStTimeToDate(r.stTime, r.rcDate);
    if (!start) continue;
    const t = start.getTime();
    if (t > nowMs && (nextStart == null || t < nextStart)) nextStart = t;
  }
  if (nextStart == null) return null;
  return Math.floor((nextStart - nowMs) / 60_000);
}

/** Format rcDate YYYYMMDD to next race day label like "금요일 (3/7)" */
function formatNextRaceDateLabel(rcDate: string): string {
  const y = parseInt(rcDate.slice(0, 4), 10);
  const m = parseInt(rcDate.slice(4, 6), 10);
  const d = parseInt(rcDate.slice(6, 8), 10);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayName = WEEK_DAYS[date.getUTCDay()];
  return `${dayName}요일 (${m}/${d})`;
}

export default function DateHeader() {
  const kst = getTodayKstDate();
  const { year, month, day, weekDay } = kst;
  const weekDayName = WEEK_DAYS[weekDay];
  const todayYyyymmdd = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;

  // Fetch today's races
  const { data: todayData } = useQuery({
    queryKey: ['races', 'today', 'stats'],
    queryFn: () => RaceApi.getRaces({ limit: 100, page: 1, date: 'today' }),
    placeholderData: keepPreviousData,
  });
  const races = useMemo(
    () => (todayData?.races ?? []) as RaceWithTime[],
    [todayData?.races],
  );
  const todayCount = todayData?.total ?? races.length;
  const todayHasRaces = todayCount > 0;
  const todayAllEnded =
    todayHasRaces &&
    races.length > 0 &&
    races.every((r) => isRaceActuallyEnded(r.rcDate, r.stTime));

  // Fetch next upcoming race date from DB (tomorrow onwards, limit 1)
  const shouldFetchNext = !todayHasRaces || todayAllEnded;
  const { data: nextData } = useQuery({
    queryKey: ['races', 'next-upcoming', todayYyyymmdd],
    queryFn: async () => {
      // Tomorrow's YYYYMMDD
      const tomorrow = new Date(Date.UTC(year, month - 1, day + 1));
      const tY = tomorrow.getUTCFullYear();
      const tM = String(tomorrow.getUTCMonth() + 1).padStart(2, '0');
      const tD = String(tomorrow.getUTCDate()).padStart(2, '0');
      const dateFrom = `${tY}${tM}${tD}`;
      // Look 30 days ahead
      const future = new Date(Date.UTC(year, month - 1, day + 30));
      const fY = future.getUTCFullYear();
      const fM = String(future.getUTCMonth() + 1).padStart(2, '0');
      const fD = String(future.getUTCDate()).padStart(2, '0');
      const dateTo = `${fY}${fM}${fD}`;
      // Server sorts rcDate DESC, so fetch enough to find the earliest date
      const res = await RaceApi.getRaces({ limit: 100, page: 1, dateFrom, dateTo });
      const upcoming = res?.races ?? [];
      if (upcoming.length === 0) return null;
      // Find the race with the earliest rcDate
      let earliest = upcoming[0];
      for (const r of upcoming) {
        if (r.rcDate && earliest.rcDate && r.rcDate < earliest.rcDate) earliest = r;
      }
      return earliest;
    },
    enabled: shouldFetchNext,
    staleTime: 10 * 60 * 1000, // 10 min
  });

  const nextRaceDayLabel = useMemo(() => {
    if (!shouldFetchNext) return null;
    const nextRace = nextData as RaceWithTime | null;
    if (!nextRace?.rcDate || nextRace.rcDate.length < 8) return null;
    return formatNextRaceDateLabel(nextRace.rcDate);
  }, [shouldFetchNext, nextData]);

  const msg = getDateHeaderMessage(todayCount, nextRaceDayLabel, todayAllEnded);

  const [countdownMins, setCountdownMins] = useState<number | null>(() =>
    getNextRaceMinutes(races),
  );
  useEffect(() => {
    if (todayAllEnded || races.length === 0) return;
    const tick = () => setCountdownMins(getNextRaceMinutes(races));
    const id = setInterval(tick, COUNTDOWN_TICK_MS);
    queueMicrotask(tick);
    return () => clearInterval(id);
  }, [races, todayAllEnded]);

  const showCountdown = todayHasRaces && !todayAllEnded && countdownMins != null && countdownMins > 0;

  return (
    <div className='home-hero'>
      <div className='relative z-10 flex items-center justify-between gap-4'>
        <div>
          <p className='text-stone-400 text-sm mb-1 whitespace-nowrap'>
            {year}.{String(month).padStart(2, '0')}.{String(day).padStart(2, '0')} ({weekDayName})
          </p>
          <h1 className='text-lg sm:text-xl font-bold text-white mb-1'>
            {msg.title}
          </h1>
          <p className='text-stone-400 text-sm'>
            {msg.subtitle}
          </p>
          {showCountdown && (
            <p className={`text-sm font-medium mt-1.5 flex items-center gap-1 ${countdownMins <= 5 ? 'text-amber-400 animate-pulse' : 'text-primary/90'}`}>
              <Icon name='Clock' size={13} />
              {countdownMins <= 1 ? '다음 경주 곧 시작!' : `다음 경주 ${countdownMins}분 후`}
            </p>
          )}
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          {msg.showTodayLink && (
            <Link
              href={`${routes.races.list}?date=today`}
              className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark active:opacity-90 transition-colors whitespace-nowrap touch-manipulation'
            >
              <Icon name='Flag' size={15} />
              오늘의 경주
            </Link>
          )}
          <Link
            href={routes.predictions.matrix}
            className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 text-stone-300 text-sm font-medium hover:bg-white/15 active:opacity-90 transition-colors whitespace-nowrap touch-manipulation'
          >
            <Icon name='BarChart2' size={15} />
            종합 예상
          </Link>
        </div>
      </div>
    </div>
  );
}
