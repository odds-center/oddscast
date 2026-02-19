/**
 * 경주 헤더 — 필수 정보만
 * 경마장, 경주번호, 출발시각, 거리
 */
import Icon from '@/components/icons';

/** KRA 게이트 색상 */
const GATE_COLORS: Record<number, string> = {
  1: '#ffffff', 2: '#facc15', 3: '#ef4444', 4: '#171717', 5: '#3b82f6',
  6: '#22c55e', 7: '#a855f7', 8: '#ec4899', 9: '#a3a3a3', 10: '#0ea5e9',
  11: '#84cc16', 12: '#f97316', 13: '#38bdf8', 14: '#fde047',
};

export interface RaceHeaderProps {
  meetName?: string;
  rcDay?: string;
  rcNo?: string;
  rcDate?: string;
  stTime?: string;
  rcDist?: string;
  rank?: string;
  rcCondition?: string;
  rcPrize?: number;
  weather?: string;
  track?: string;
}

function formatRcDate(rcDate?: string): string {
  if (!rcDate || rcDate.length < 8) return '';
  const s = String(rcDate).replace(/-/g, '').slice(0, 8);
  return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
}

export default function RaceHeaderCard({
  meetName,
  rcDay,
  rcNo,
  rcDate,
  stTime,
  rcDist,
  rank,
  rcCondition,
  rcPrize,
  weather,
  track,
}: RaceHeaderProps) {
  const hasMeta = rcDist || rank || rcCondition || rcPrize != null || weather || track;
  return (
    <div className='rounded-xl border border-slate-200 bg-card overflow-hidden shadow-sm'>
      <div className='flex items-center justify-between px-4 sm:px-5 py-4 bg-gradient-to-r from-slate-50 to-white'>
        <div className='flex items-center gap-3'>
          <span className='font-display font-bold text-slate-800 text-lg sm:text-xl'>
            {rcDay ? `${rcDay} ` : ''}{meetName ?? '-'}
          </span>
          <span className='px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 text-sm font-medium'>
            제 {rcNo ?? '-'} 경주
          </span>
        </div>
        {stTime && (
          <span className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 font-semibold text-sm'>
            <Icon name='Clock' size={16} className='shrink-0' />
            {stTime}
          </span>
        )}
      </div>
      {hasMeta && (
        <div className='px-4 sm:px-5 py-2.5 border-t border-border bg-slate-50/50'>
          <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary'>
            {rcDate && (
              <span className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white border border-border'>
                <Icon name='Calendar' size={14} className='shrink-0 text-text-tertiary' />
                <span>{formatRcDate(rcDate)}</span>
              </span>
            )}
            {rcDist && (
              <span className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white border border-border'>
                <Icon name='Ruler' size={14} className='shrink-0 text-text-tertiary' />
                <span className='font-medium'>{rcDist}m</span>
              </span>
            )}
            {rcPrize != null && rcPrize > 0 && (
              <span className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-medium'>
                <Icon name='Award' size={14} className='shrink-0' />
                <span>1착 {rcPrize.toLocaleString()}만원</span>
              </span>
            )}
            {rank && (
              <span className='inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200'>
                {rank}
              </span>
            )}
            {rcCondition && (
              <span className='inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-200'>
                {rcCondition}
              </span>
            )}
            {weather && (
              <span className='inline-flex items-center gap-1'>
                <span className='text-text-tertiary'>날씨</span>
                <span>{weather}</span>
              </span>
            )}
            {track && (
              <span className='inline-flex items-center gap-1'>
                <span className='text-text-tertiary'>주로</span>
                <span>{track}</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function getGateBgColor(gateNo: number): string {
  return GATE_COLORS[gateNo] ?? '#6b7280';
}
