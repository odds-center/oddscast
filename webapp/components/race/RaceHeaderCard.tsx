/**
 * Race header
 */
import Icon from '@/components/icons';
import { formatRcDate, formatNumber } from '@/lib/utils/format';

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

export default function RaceHeaderCard({
  meetName, rcDay, rcNo, rcDate, stTime, rcDist, rank, rcCondition, rcPrize, weather, track,
}: RaceHeaderProps) {
  return (
    <div className='rounded border border-stone-200 bg-white overflow-hidden'>
      <div className='flex items-center justify-between px-3 py-2 bg-stone-50 border-b border-stone-200'>
        <div className='flex items-center gap-2'>
          <span className='font-bold text-foreground text-sm whitespace-nowrap'>
            {rcDay ? `${rcDay} ` : ''}{meetName ?? '-'}
          </span>
          <span className='text-xs px-1.5 py-px rounded bg-stone-200 text-stone-700 font-medium whitespace-nowrap'>
            {rcNo ?? '-'}R
          </span>
        </div>
        {stTime && (
          <span className='flex items-center gap-1 text-sm font-semibold text-stone-600 whitespace-nowrap'>
            <Icon name='Clock' size={13} className='shrink-0' />
            {stTime}
          </span>
        )}
      </div>
      <div className='px-3 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500'>
        {rcDate && (
          <span className='inline-flex items-center gap-1 whitespace-nowrap'>
            <Icon name='Calendar' size={11} className='text-stone-400' />
            {formatRcDate(rcDate)}
          </span>
        )}
        {rcDist && <span className='font-medium whitespace-nowrap'>{rcDist}m</span>}
        {rcPrize != null && rcPrize > 0 && (
          <span className='font-medium whitespace-nowrap'>1착 {formatNumber(rcPrize)}만원</span>
        )}
        {rank && <span className='whitespace-nowrap'>{rank}</span>}
        {rcCondition && <span className='whitespace-nowrap'>{rcCondition}</span>}
        {weather && <span className='whitespace-nowrap'>날씨 {weather}</span>}
        {track && <span className='whitespace-nowrap'>주로 {track}</span>}
      </div>
    </div>
  );
}

export function getGateBgColor(gateNo: number): string {
  return GATE_COLORS[gateNo] ?? '#6b7280';
}
