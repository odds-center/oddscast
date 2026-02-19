import React from 'react';
import Link from 'next/link';
import Icon from './icons';
import { StatusBadge } from './ui';
import { routes } from '@/lib/routes';

interface RaceCardProps {
  race: {
    id: string;
    rcName?: string;
    meetName?: string;
    rcNo?: string;
    rcDist?: string;
    rank?: string;
    stTime?: string; // KRA: 출발시각
    rcStartTime?: string; // mock/legacy 호환
    status?: string;
    raceStatus?: string;
    entries?: Array<{ chulNo?: string; hrName?: string }>;
    entryDetails?: Array<{ chulNo?: string; hrName?: string }>;
  };
}

const RaceCard: React.FC<RaceCardProps> = ({ race }) => {
  const name = race.rcName ?? `경주 ${race.rcNo ?? ''}`;
  const status = race.status || race.raceStatus || '';
  const entries = (race.entries ?? race.entryDetails ?? []) as Array<{ chulNo?: string; hrName?: string }>;
  const entryPreview = entries.slice(0, 4).map((e) => e.hrName ?? '').filter(Boolean).join(', ');

  return (
    <Link href={routes.races.detail(race.id)} className='block group touch-manipulation'>
      <div className='card card-hover flex items-center gap-3 sm:gap-4 py-4 sm:py-5 px-4 sm:px-5 lg:px-6 border-l-[4px] border-l-primary'>
        <div className='flex flex-col items-center justify-center min-w-[56px] sm:min-w-[64px] py-2 rounded-lg bg-primary/10 border border-primary/25 shrink-0'>
          <Icon name='Flag' size={18} className='text-primary/80 mb-0.5 sm:mb-1' strokeWidth={2} />
          <span className='font-display font-bold text-base lg:text-lg text-primary'>
            {race.rcNo}경
          </span>
          <span className='text-text-tertiary text-xs mt-0.5'>{race.meetName}</span>
        </div>
        <div className='flex-1 min-w-0'>
          <div className='text-foreground font-semibold truncate lg:truncate-none group-hover:text-primary transition-colors'>
            {name}
          </div>
          <div className='flex items-center gap-3 text-text-secondary text-xs lg:text-sm mt-1.5'>
            {race.rcDist && <span className='flex items-center gap-1'><Icon name='Ruler' size={12} />{race.rcDist}m</span>}
            {(race.stTime ?? race.rcStartTime) && (
              <span className='flex items-center gap-1'><Icon name='Clock' size={12} />{race.stTime ?? race.rcStartTime}</span>
            )}
          </div>
          {entryPreview && (
            <div className='text-text-tertiary text-xs mt-2 truncate' title={entryPreview}>
              출전: {entryPreview}{entries.length > 4 ? ' 외' : ''}
            </div>
          )}
        </div>
        <StatusBadge status={status} />
      </div>
    </Link>
  );
};

export default RaceCard;
