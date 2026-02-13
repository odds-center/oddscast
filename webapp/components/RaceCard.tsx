import React from 'react';
import Link from 'next/link';
import Icon from './icons';
import { routes } from '@/lib/routes';

interface RaceCardProps {
  race: {
    id: string;
    raceName?: string;
    rcName?: string;
    meetName?: string;
    rcNo?: string;
    rcDist?: string;
    rcGrade?: string;
    rcStartTime?: string;
    status?: string;
    raceStatus?: string;
  };
}

const RaceCard: React.FC<RaceCardProps> = ({ race }) => {
  const name = race.raceName || race.rcName || `경주 ${race.rcNo || ''}`;
  const status = race.status || race.raceStatus || '';

  const statusStyle =
    status === 'SCHEDULED' || status === 'scheduled'
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      : status === 'COMPLETED' || status === 'completed'
        ? 'bg-zinc-600/30 text-zinc-400 border-zinc-600/50'
        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

  return (
    <Link href={routes.races.detail(race.id)} className='block group touch-manipulation'>
      <div className='card card-hover flex items-center gap-3 sm:gap-4 py-3.5 sm:py-4 px-4 sm:px-5 lg:px-6 border-l-4 border-l-primary/60'>
        <div className='flex flex-col items-center justify-center min-w-[52px] sm:min-w-[60px] lg:min-w-[72px] py-2 rounded-xl bg-primary/5 border border-primary/10 pr-3 sm:pr-4 lg:pr-5'>
          <Icon name='Flag' size={18} className='text-primary/80 mb-0.5 sm:mb-1' strokeWidth={2} />
          <span className='font-display font-bold text-base lg:text-lg text-primary'>
            {race.rcNo}경
          </span>
          <span className='text-text-tertiary text-xs sm:text-xs mt-0.5'>{race.meetName}</span>
        </div>
        <div className='flex-1 min-w-0'>
          <div className='text-foreground font-semibold truncate lg:truncate-none group-hover:text-primary transition-colors'>
            {name}
          </div>
          <div className='flex items-center gap-3 text-text-secondary text-xs lg:text-sm mt-1.5'>
            <span className='flex items-center gap-1'><Icon name='Ruler' size={12} />{race.rcDist}m</span>
            <span className='flex items-center gap-1'><Icon name='Award' size={12} />{race.rcGrade}</span>
            {race.rcStartTime && (
              <span className='hidden lg:flex items-center gap-1 text-text-tertiary'><Icon name='Calendar' size={12} />{race.rcStartTime}</span>
            )}
          </div>
        </div>
        <span
          className={`text-xs lg:text-xs px-2.5 py-1.5 rounded-xl font-medium uppercase shrink-0 border ${statusStyle}`}
        >
          {status || '-'}
        </span>
      </div>
    </Link>
  );
};

export default RaceCard;
