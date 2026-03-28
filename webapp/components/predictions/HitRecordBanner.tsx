/**
 * Hit record banner — shows recent AI prediction hits with dividend highlights
 */
import type { HitRecordDto } from '@/lib/api/predictionMatrixApi';
import Icon from '@/components/icons';
import Link from 'next/link';
import { routes } from '@/lib/routes';

export interface HitRecordBannerProps {
  records: HitRecordDto[];
}

/** Format odds as Korean won style */
function formatOdds(odds: number): string {
  if (odds >= 100) return `${Math.round(odds)}배`;
  return `${odds.toFixed(1)}배`;
}

/** Bet type badge color by pool code */
function getBetTypeColor(code: string | null | undefined): string {
  switch (code) {
    case 'WIN': return 'bg-emerald-100 text-emerald-800';
    case 'PLC': return 'bg-green-100 text-green-800';
    case 'QNL': return 'bg-blue-100 text-blue-800';
    case 'EXA': return 'bg-violet-100 text-violet-800';
    case 'TLA': return 'bg-amber-100 text-amber-800';
    case 'TRI': return 'bg-rose-100 text-rose-800';
    default: return 'bg-stone-100 text-stone-600';
  }
}

export default function HitRecordBanner({ records }: HitRecordBannerProps) {
  if (!records.length) return null;

  // Separate records with high dividends for featured display
  const featured = records.filter((r) => r.dividendOdds && r.dividendOdds >= 10);
  const rest = records.filter((r) => !r.dividendOdds || r.dividendOdds < 10);

  return (
    <div className='rounded-xl border border-stone-200 bg-stone-50 overflow-hidden mb-4'>
      {/* Header */}
      <div className='flex items-center gap-2.5 px-4 py-2.5 border-b border-border'>
        <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-sm'>
          <Icon name='Trophy' size={13} />
          HIT
        </span>
        <span className='font-semibold text-stone-700 text-sm'>최근 적중 기록</span>
        <span className='text-text-tertiary text-xs ml-auto'>{records.length}건</span>
      </div>

      {/* Featured high-dividend hits */}
      {featured.length > 0 && (
        <div className='px-3 pt-3 pb-1 space-y-2'>
          {featured.map((r) => (
            <div key={r.id} className='rounded-lg border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/50 p-3'>
              <div className='flex items-center justify-between gap-2 mb-1.5'>
                <div className='flex items-center gap-2'>
                  {r.betType && (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${getBetTypeColor(r.betTypeCode)}`}>
                      {r.betType}
                    </span>
                  )}
                  <span className='text-xs text-text-secondary'>
                    {r.hitDate} {r.meet} {r.rcNo ? `${r.rcNo}R` : ''}
                  </span>
                </div>
                {r.dividendOdds && (
                  <span className='text-sm font-bold text-amber-700 tabular-nums'>
                    {formatOdds(r.dividendOdds)}
                  </span>
                )}
              </div>
              <div className='flex items-center justify-between gap-2'>
                <p className='text-sm font-medium text-foreground'>
                  {r.accuracy != null && (
                    <span className='text-emerald-700 mr-1'>{r.accuracy}% 적중</span>
                  )}
                  {r.dividendOdds && r.dividendOdds >= 100 && (
                    <span className='text-amber-700'>고배당!</span>
                  )}
                </p>
                {r.raceId && (
                  <Link
                    href={routes.races.detail(String(r.raceId))}
                    className='text-[11px] text-primary font-medium hover:underline shrink-0'
                  >
                    경주 보기
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regular hit records */}
      {rest.length > 0 && (
        <div className='divide-y divide-border'>
          {rest.map((r) => (
            <div key={r.id} className='px-4 py-2.5 flex items-center gap-3'>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  {r.accuracy != null && (
                    <span className={`text-xs font-bold tabular-nums ${
                      r.accuracy >= 66 ? 'text-emerald-700' : r.accuracy >= 33 ? 'text-primary' : 'text-text-secondary'
                    }`}>
                      {r.accuracy}%
                    </span>
                  )}
                  <span className='text-sm text-foreground'>
                    {r.hitDate} {r.meet} {r.rcNo ? `${r.rcNo}R` : ''}
                  </span>
                  {r.betType && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getBetTypeColor(r.betTypeCode)}`}>
                      {r.betType}
                    </span>
                  )}
                </div>
              </div>
              {r.dividendOdds && (
                <span className='text-xs font-semibold text-amber-700 tabular-nums shrink-0'>
                  {formatOdds(r.dividendOdds)}
                </span>
              )}
              {r.raceId && (
                <Link
                  href={routes.races.detail(String(r.raceId))}
                  className='text-[11px] text-text-tertiary hover:text-primary shrink-0'
                >
                  <Icon name='ChevronRight' size={14} />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
