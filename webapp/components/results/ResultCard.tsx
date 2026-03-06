import Link from 'next/link';
import Icon from '../icons';
import { formatRcDate, formatRaceTime } from '@/lib/utils/format';
import { routes } from '@/lib/routes';

export interface Top3Item {
  ord: string;
  chulNo?: string;
  hrNo: string;
  hrName: string;
  jkName: string;
  rcTime?: string;
}

export interface ResultCardProps {
  id?: string;
  raceId?: string;
  meetName?: string;
  rcNo?: string;
  rcDate?: string;
  rcDist?: string;
  top3: Top3Item[];
}

const RANK_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  '1': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  '2': { bg: 'bg-[#c0c0c5]/12', text: 'text-[#c0c0c5]', border: 'border-[#c0c0c5]/25' },
  '3': { bg: 'bg-[#cd7f32]/12', text: 'text-[#cd7f32]', border: 'border-[#cd7f32]/25' },
};

export default function ResultCard({ meetName, rcNo, rcDate, rcDist, top3, raceId, id }: ResultCardProps) {
  const linkId = raceId ?? id ?? '';
  const firstPlace = top3.find((p) => p.ord === '1');
  const winTime = firstPlace?.rcTime;

  return (
    <Link
      href={routes.races.detail(linkId)}
      className='block group touch-manipulation'
    >
      <div className='card card-hover flex flex-col gap-3 py-4 px-4 sm:px-5 border-l-[4px] border-l-slate-400 h-full'>
        {/* Race information */}
        <div className='flex items-center gap-3 min-w-0'>
          <div className='flex flex-col items-center justify-center min-w-[52px] py-2 rounded-lg bg-stone-100 border border-stone-200 shrink-0'>
            <Icon name='Trophy' size={16} className='text-stone-500 mb-0.5' strokeWidth={2} />
            <span className='font-display font-bold text-sm text-stone-700'>{rcNo}경</span>
            <span className='text-text-tertiary text-[12px] mt-0.5 truncate max-w-full'>{meetName}</span>
          </div>
          <div className='flex-1 min-w-0 space-y-0.5'>
            <span className='text-text-secondary text-sm block'>{formatRcDate(rcDate)}</span>
            {(rcDist || winTime) && (
              <span className='text-text-tertiary text-xs flex items-center gap-2'>
                {rcDist && <span>{rcDist}m</span>}
                {winTime && <span className='font-mono'>{formatRaceTime(winTime)}</span>}
              </span>
            )}
          </div>
        </div>

        {/* 1st, 2nd, 3rd place */}
        <div className='flex-1 min-w-0 overflow-x-auto'>
          {top3.length > 0 ? (
            <table className='data-table data-table-compact w-full min-w-[200px]'>
              <thead>
                <tr>
                  <th className='cell-center w-10'>순위</th>
                  <th className='min-w-[60px]'>마명</th>
                  <th>기수</th>
                </tr>
              </thead>
              <tbody>
                {top3.map((p) => {
                  const style = RANK_STYLES[p.ord] ?? { bg: 'bg-card', text: 'text-text-secondary', border: 'border-border' };
                  return (
                    <tr key={`${p.ord}-${p.hrNo}`} className={`border-b border-border last:border-0 ${style.bg} ${style.text}`}>
                      <td className='cell-center font-bold'>{p.ord}</td>
                      <td className='font-medium'>{p.hrName}</td>
                      <td className='text-text-tertiary'>{p.jkName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <span className='text-text-tertiary text-sm py-1'>결과 없음</span>
          )}
        </div>

        <div className='flex justify-end'>
          <Icon name='ChevronRight' size={18} className='text-text-tertiary shrink-0 opacity-60 group-hover:opacity-100 group-hover:text-stone-600 transition-all' />
        </div>
      </div>
    </Link>
  );
}
