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
  rcNo?: string;
  stTime?: string;
  rcDist?: string;
}

export default function RaceHeaderCard({
  meetName,
  rcNo,
  stTime,
  rcDist,
}: RaceHeaderProps) {
  return (
    <div className='rounded-xl border border-primary/25 bg-card overflow-hidden'>
      <div className='flex items-center justify-between px-4 py-3 bg-primary/15'>
        <div className='flex items-center gap-3'>
          <span className='font-display font-bold text-primary text-lg'>
            {meetName ?? '-'}
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
      {rcDist && (
        <div className='px-4 py-2 border-t border-border text-sm text-text-secondary flex items-center gap-1.5'>
          <Icon name='Ruler' size={14} className='shrink-0' />
          {rcDist}m
        </div>
      )}
    </div>
  );
}

export function getGateBgColor(gateNo: number): string {
  return GATE_COLORS[gateNo] ?? '#6b7280';
}
