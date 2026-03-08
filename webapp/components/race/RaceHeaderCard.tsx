/**
 * Race header — key info as badges with tooltips for jargon
 */
import type { ReactNode } from 'react';
import Icon from '@/components/icons';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';
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

function InfoBadge({
  label,
  tooltip,
  children,
}: {
  label: string;
  tooltip: string;
  children?: ReactNode;
}) {
  return (
    <Tooltip content={tooltip} inline>
      <Badge variant='muted' size='sm'>
        {children ?? label}
      </Badge>
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

  return (
    <div className='rounded border border-stone-200 bg-white overflow-hidden'>
      <div className='flex items-center justify-between px-3 py-2 bg-stone-50 border-b border-stone-200'>
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
      <div className='px-3 py-2 flex flex-wrap items-center gap-1.5'>
        {rcDate && (
          <span className='inline-flex items-center gap-1 text-xs text-stone-500 whitespace-nowrap'>
            <Icon name='Calendar' size={14} className='text-stone-500' />
            {formatRcDate(rcDate)}
          </span>
        )}
        {rcDist && <Badge variant='muted' size='sm'>{rcDist}m</Badge>}
        {rcPrize != null && rcPrize > 0 && (
          <Badge variant='muted' size='sm'>1착 {formatNumber(rcPrize)}만원</Badge>
        )}
        {rankTerm && (
          <InfoBadge label={rankTerm.label} tooltip={rankTerm.tooltip}>
            {rankTerm.label}
          </InfoBadge>
        )}
        {rcConditionTerm && (
          <InfoBadge label={rcConditionTerm.label} tooltip={rcConditionTerm.tooltip}>
            {rcConditionTerm.label}
          </InfoBadge>
        )}
        {budamTerm && (
          <InfoBadge label={budamTerm.label} tooltip={budamTerm.tooltip}>
            {budamTerm.label}
          </InfoBadge>
        )}
        {weatherTerm && (
          <InfoBadge label={weatherTerm.label} tooltip={weatherTerm.tooltip}>
            날씨 {weatherTerm.label}
          </InfoBadge>
        )}
        {trackTerm && (
          <InfoBadge label={trackTerm.label} tooltip={trackTerm.tooltip}>
            주로 {trackTerm.label}
          </InfoBadge>
        )}
      </div>
    </div>
  );
}

