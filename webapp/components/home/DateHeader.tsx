/**
 * Home hero banner — KRA style dark banner
 * Copy varies by today's race count and next race day.
 * On race days, shows countdown to next race when available.
 */
import Icon from '@/components/icons';
import Link from 'next/link';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import RaceApi from '@/lib/api/raceApi';
import { routes } from '@/lib/routes';
import { getDateHeaderMessage, getNextRaceDayLabel } from '@/lib/utils/dateHeaderMessages';
import { parseStTimeToDate, isTodayRcDate } from '@/lib/utils/format';

const RACE_DAYS = [5, 6, 0]; // Fri, Sat, Sun
const LIVE_REFETCH_MS = 5 * 60 * 1000; // 5 min on race days
const COUNTDOWN_TICK_MS = 60 * 1000; // 1 min

function isRaceDay(date: Date): boolean {
  return RACE_DAYS.includes(date.getDay());
}

type RaceWithTime = { rcDate?: string; stTime?: string; rcNo?: string };

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

export default function DateHeader() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekDay = weekDays[now.getDay()];
  const isTodayRaceDay = isRaceDay(now);

  const { data: todayData } = useQuery({
    queryKey: ['races', 'today', 'stats'],
    queryFn: () => RaceApi.getRaces({ limit: 100, page: 1, date: 'today' }),
    placeholderData: keepPreviousData,
    refetchInterval: isTodayRaceDay ? LIVE_REFETCH_MS : false,
  });
  const races = (todayData?.races ?? []) as RaceWithTime[];
  const todayCount = todayData?.total ?? races.length;
  const nextRaceDayLabel = getNextRaceDayLabel(RACE_DAYS, now);
  const msg = getDateHeaderMessage(todayCount, nextRaceDayLabel);

  const [countdownMins, setCountdownMins] = useState<number | null>(() => getNextRaceMinutes(races));
  useEffect(() => {
    setCountdownMins(getNextRaceMinutes(races));
    if (!isTodayRaceDay || races.length === 0) return;
    const tick = () => setCountdownMins((prev) => {
      const next = getNextRaceMinutes(races);
      return next;
    });
    const id = setInterval(tick, COUNTDOWN_TICK_MS);
    return () => clearInterval(id);
  }, [races, isTodayRaceDay]);

  const showCountdown = isTodayRaceDay && todayCount > 0 && countdownMins != null && countdownMins > 0;

  return (
    <div className='home-hero'>
      <div className='relative z-10 flex items-center justify-between gap-4'>
        <div>
          <p className='text-stone-400 text-xs mb-1 whitespace-nowrap'>
            {year}.{String(month).padStart(2, '0')}.{String(day).padStart(2, '0')} ({weekDay})
          </p>
          <h1 className='text-base sm:text-lg font-bold text-white mb-1'>
            {msg.title}
          </h1>
          <p className='text-stone-400 text-xs'>
            {msg.subtitle}
          </p>
          {showCountdown && (
            <p className='text-primary/90 text-xs font-medium mt-1.5 flex items-center gap-1'>
              <Icon name='Clock' size={12} />
              {countdownMins <= 1 ? '다음 경주 곧 시작' : `다음 경주 ${countdownMins}분 후`}
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
