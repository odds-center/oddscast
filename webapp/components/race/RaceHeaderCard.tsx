/**
 * Race header — key info with clear visual hierarchy
 * Primary: distance + prize (key betting info)
 * Secondary: rank + condition + budam + weather + track (race classification)
 */
import type { ReactNode } from 'react';
import Icon from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import Tooltip from '@/components/ui/SimpleTooltip';
import { formatRcDate, formatNumber } from '@/lib/utils/format';
import {
  getRankTerm,
  getRcConditionTerm,
  getBudamTerm,
  getWeatherTerm,
  getTrackTerm,
} from '@/lib/utils/raceTerms';


export interface RaceHeaderProps {
  meetName?: string;
  rcDay?: string;
  rcNo?: string;
  rcDate?: string;
  stTime?: string;
  rcDist?: string;
  rank?: string;
  rcCondition?: string;
  /** 부담구분 (별정A, 마령 등) — 툴팁으로 설명 */
  budam?: string;
  rcPrize?: number;
  weather?: string;
  track?: string;
}

function ClassBadge({
  tooltip,
  children,
}: {
  tooltip: string;
  children: ReactNode;
}) {
  return (
    <Tooltip content={tooltip} inline>
      <Badge variant='muted' size='sm'>{children}</Badge>
    </Tooltip>
  );
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
  budam,
  rcPrize,
  weather,
  track,
}: RaceHeaderProps) {
  const rankTerm = getRankTerm(rank);
  const rcConditionTerm = getRcConditionTerm(rcCondition);
  const budamTerm = getBudamTerm(budam);
  const weatherTerm = getWeatherTerm(weather);
  const trackTerm = getTrackTerm(track);

  const hasClassBadges = rankTerm || rcConditionTerm || budamTerm || weatherTerm || trackTerm;

  return (
    <div className='rounded border border-stone-200 bg-white overflow-hidden'>
      {/* Top row: race identity + start time */}
      <div className='flex items-center justify-between px-3 py-2.5 bg-stone-50 border-b border-stone-200'>
        <div className='flex items-center gap-2'>
          <span className='font-bold text-foreground text-sm whitespace-nowrap'>
            {rcDay ? `${rcDay} ` : ''}{meetName ?? '-'}
          </span>
          <Badge variant='muted' size='sm'>{rcNo ?? '-'}R</Badge>
        </div>
        {stTime && (
          <span className='flex items-center gap-1 text-sm font-semibold text-stone-600 whitespace-nowrap'>
            <Icon name='Clock' size={14} className='shrink-0' />
            {stTime}
          </span>
        )}
      </div>

      {/* Primary info: distance + prize + date — key betting context */}
      <div className='flex items-center gap-4 px-3 py-2.5 border-b border-stone-100'>
        {rcDist && (
          <span className='flex items-center gap-1 text-sm font-bold text-foreground'>
            <Icon name='Ruler' size={14} className='text-stone-400 shrink-0' />
            {rcDist}m
          </span>
        )}
        {rcPrize != null && rcPrize > 0 && (
          <span className='flex items-center gap-1 text-sm font-semibold text-stone-600'>
            <Icon name='Trophy' size={13} className='text-amber-500 shrink-0' />
            1착 {formatNumber(rcPrize)}만원
          </span>
        )}
        {rcDate && (
          <span className='flex items-center gap-1 text-xs text-stone-400 ml-auto whitespace-nowrap'>
            <Icon name='Calendar' size={13} className='text-stone-400' />
            {formatRcDate(rcDate)}
          </span>
        )}
      </div>

      {/* Secondary info: classification badges */}
      {hasClassBadges && (
        <div className='px-3 py-2 flex flex-wrap items-center gap-1.5'>
          {rankTerm && (
            <ClassBadge tooltip={rankTerm.tooltip}>{rankTerm.label}</ClassBadge>
          )}
          {rcConditionTerm && (
            <ClassBadge tooltip={rcConditionTerm.tooltip}>{rcConditionTerm.label}</ClassBadge>
          )}
          {budamTerm && (
            <ClassBadge tooltip={budamTerm.tooltip}>{budamTerm.label}</ClassBadge>
          )}
          {weatherTerm && (
            <ClassBadge tooltip={`날씨: ${weatherTerm.tooltip}`}>날씨 {weatherTerm.label}</ClassBadge>
          )}
          {trackTerm && (
            <ClassBadge tooltip={`주로: ${trackTerm.tooltip}`}>주로 {trackTerm.label}</ClassBadge>
          )}
        </div>
      )}
    </div>
  );
}
