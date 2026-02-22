/**
 * Home hero banner — KRA style dark banner
 */
import Icon from '@/components/icons';
import Link from 'next/link';
import { routes } from '@/lib/routes';

const RACE_DAYS = [5, 6, 0];

export default function DateHeader() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekDay = weekDays[now.getDay()];
  const isRaceDay = RACE_DAYS.includes(now.getDay());

  const nextRaceDay = (() => {
    if (isRaceDay) return null;
    const d = new Date(now);
    for (let i = 1; i <= 7; i++) {
      d.setDate(now.getDate() + i);
      if (RACE_DAYS.includes(d.getDay())) {
        return `${weekDays[d.getDay()]}요일 (${d.getMonth() + 1}/${d.getDate()})`;
      }
    }
    return null;
  })();

  return (
    <div className='home-hero'>
      <div className='relative z-10 flex items-center justify-between gap-4'>
        <div>
          <p className='text-stone-400 text-xs mb-1 whitespace-nowrap'>
            {year}.{String(month).padStart(2, '0')}.{String(day).padStart(2, '0')} ({weekDay})
          </p>
          <h1 className='text-base sm:text-lg font-bold text-white mb-1'>
            {isRaceDay ? '오늘 경주가 진행됩니다' : 'GOLDEN RACE'}
          </h1>
          <p className='text-stone-400 text-xs'>
            {isRaceDay ? (
              'AI 분석으로 경주를 예측해보세요'
            ) : nextRaceDay ? (
              <>다음 경주일: <span className='text-[#d4a942]'>{nextRaceDay}</span></>
            ) : (
              '경마 정보·분석 서비스'
            )}
          </p>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          {isRaceDay && (
            <Link
              href={`${routes.races.list}?date=today`}
              className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#92702A] text-white text-sm font-semibold hover:bg-[#7A5D1F] active:opacity-90 transition-colors whitespace-nowrap touch-manipulation'
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
