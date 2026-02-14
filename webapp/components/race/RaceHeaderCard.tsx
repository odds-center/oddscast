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
  stTime?: string;
  rcDist?: string;
  rank?: string;
  rcCondition?: string;
  weather?: string;
  track?: string;
}

export default function RaceHeaderCard({
  meetName,
  rcDay,
  rcNo,
  stTime,
  rcDist,
  rank,
  rcCondition,
  weather,
  track,
}: RaceHeaderProps) {
  const metaItems = [rcDist ? `${rcDist}m` : null, rank, rcCondition, weather, track].filter(Boolean);
  return (
    <div className='rounded-xl border border-primary/25 bg-card overflow-hidden'>
      <div className='flex items-center justify-between px-4 py-3 bg-primary/15'>
        <div className='flex items-center gap-3'>
          <span className='font-display font-bold text-primary text-lg'>
            {rcDay ? `${rcDay} ` : ''}{meetName ?? '-'}
          </span>
          <span className='text-text-secondary text-sm'>
            제 {rcNo ?? '-'} 경주
          </span>
        </div>
        {stTime && (
          <span className='flex items-center gap-1 font-semibold text-foreground'>
            <Icon name='Clock' size={16} />
            {stTime}
          </span>
        )}
      </div>
      {metaItems.length > 0 && (
        <div className='px-4 py-2 border-t border-border text-sm text-text-secondary flex flex-wrap items-center gap-x-4 gap-y-1'>
          {rcDist && (
            <span className='flex items-center gap-1.5'>
              <Icon name='Ruler' size={14} className='shrink-0' />
              {rcDist}m
            </span>
          )}
          {rank && <span>{rank}</span>}
          {rcCondition && <span>{rcCondition}</span>}
          {weather && <span>날씨 {weather}</span>}
          {track && <span>주로 {track}</span>}
        </div>
      )}
    </div>
  );
}

export function getGateBgColor(gateNo: number): string {
  return GATE_COLORS[gateNo] ?? '#6b7280';
}
