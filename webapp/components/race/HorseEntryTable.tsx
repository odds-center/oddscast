/**
 * Horse entry table — rich information + refined UI
 * No (gate), horse name, jockey/trainer, age/origin, weight carried, horse weight, rating, career record, recent ranks
 */
import Link from 'next/link';
import Icon from '@/components/icons';
import Tooltip from '@/components/ui/SimpleTooltip';
import { routes } from '@/lib/routes';

/** Horse entry fields required for rendering */
export interface HorseEntryRow {
  id?: string | number;
  hrNo: string;
  hrName: string;
  jkName?: string;
  trName?: string;
  owName?: string;
  chulNo?: string;
  wgBudam?: number;
  horseWeight?: string;
  rating?: number;
  sex?: string;
  age?: number;
  prd?: string;
  rcCntT?: number;
  ord1CntT?: number;
  recentRanks?: unknown;
  equipment?: string;
  budam?: string;
}

/** horseWeight "502(-2)" → { base: 502, delta: -2 } (horse weight in kg, change from previous) */
function parseHorseWeight(hw?: string): { base?: number; delta?: number } {
  if (!hw || typeof hw !== 'string') return {};
  const m = hw.match(/^(\d+)(\(([+-]?\d+)\))?$/);
  if (!m) return {};
  const base = parseInt(m[1], 10);
  const delta = m[3] != null ? parseInt(m[3], 10) : undefined;
  return { base, delta };
}

/** Age/origin format: prd (origin) + age + sex → Kr4M, US3F (example: Korean 4-year-old male, US 3-year-old female) */
function formatAgeSexOrigin(prd?: string, age?: number, sex?: string): string {
  const parts: string[] = [];
  const prdMap: Record<string, string> = { 한국: '한', 미국: '미', 일본: '일', 아일랜드: '아', 영국: '영' };
  if (prd) parts.push(prdMap[prd] ?? prd.slice(0, 1));
  if (age != null) parts.push(String(age));
  if (sex) parts.push(sex === '수' ? '수' : sex === '암' ? '암' : sex === '거' ? '거' : sex);
  return parts.length ? parts.join('') : '-';
}

/** Career record format: rcCntT, ord1CntT → "20R 3W" (20 races, 3 wins) */
function formatRecord(rcCntT?: number, ord1CntT?: number): string {
  if (rcCntT == null && ord1CntT == null) return '-';
  const total = rcCntT ?? 0;
  const wins = ord1CntT ?? 0;
  return total > 0 ? `${total}전 ${wins}승` : '-';
}

/** recentRanks [1,3,5] → "1-3-5" */
function formatRecentRanks(ranks?: unknown): string {
  if (!Array.isArray(ranks) || ranks.length === 0) return '-';
  return ranks.slice(0, 5).join('-');
}

export interface HorseEntryTableProps {
  entries: HorseEntryRow[];
  onSelectHorse?: (hrNo: string, hrName: string) => void;
  isSelected?: (hrNo: string) => boolean;
  /** When set, horse profile link includes ?from= so back button returns to this race */
  raceId?: string | number;
  /** Final win/place odds per horse (hrNo → odds). Only available for completed races. */
  oddsMap?: Map<string, { winOdds?: number; plcOdds?: number }>;
}

function horseProfileHref(hrNo: string, raceId?: string | number): string {
  const base = routes.horses.detail(hrNo);
  if (raceId != null) {
    return `${base}?from=${encodeURIComponent(routes.races.detail(String(raceId)))}`;
  }
  return base;
}

export default function HorseEntryTable({ entries, onSelectHorse, isSelected, raceId, oddsMap }: HorseEntryTableProps) {
  const showOdds = !!oddsMap && oddsMap.size > 0;
  return (
    <div className='space-y-2 sm:space-y-0'>
      {/* Mobile: card layout */}
      <div className='block sm:hidden space-y-2'>
        {entries.map((e) => {
          const { base: hwBase, delta: hwDelta } = parseHorseWeight(e.horseWeight);
          const ageSex = formatAgeSexOrigin(e.prd, e.age ?? undefined, e.sex);
          const record = formatRecord(e.rcCntT, e.ord1CntT);
          const recentStr = formatRecentRanks(e.recentRanks);

          const odds = oddsMap?.get(e.hrNo);
          return (
            <div
              key={e.id ?? e.hrNo}
              role={onSelectHorse ? 'button' : undefined}
              tabIndex={onSelectHorse ? 0 : undefined}
              onClick={() => onSelectHorse?.(e.hrNo, e.hrName)}
              onKeyDown={(ev) => onSelectHorse && (ev.key === 'Enter' || ev.key === ' ') && onSelectHorse(e.hrNo, e.hrName)}
              className={`
                rounded-xl border overflow-hidden transition-all duration-200
                ${onSelectHorse ? 'cursor-pointer active:scale-[0.99]' : ''}
                ${isSelected?.(e.hrNo) ? 'ring-2 ring-primary-500 border-primary-400 bg-primary-50/30' : 'border-border bg-card hover:border-stone-300'}
              `}
            >
              <div className='p-4'>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    {e.chulNo != null && (
                      <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-800 text-white text-xs font-bold shrink-0'>
                        {e.chulNo}
                      </span>
                    )}
                    <Link
                      href={horseProfileHref(e.hrNo, raceId)}
                      onClick={(ev) => ev.stopPropagation()}
                      className='font-semibold text-foreground hover:text-primary hover:underline'
                    >
                      {e.hrName}
                    </Link>
                    {e.rating != null && (
                      <span className='inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800'>
                        R{e.rating}
                      </span>
                    )}
                  </div>
                  <div className='flex items-center gap-2 mt-0.5 text-text-secondary text-sm'>
                    {e.jkName && <span>{e.jkName}</span>}
                    {e.trName && <span className='text-text-tertiary'>/ {e.trName}</span>}
                    {e.owName && <span className='text-text-tertiary'>/ {e.owName}</span>}
                  </div>
                  <div className='flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-text-tertiary'>
                    {ageSex !== '-' && <span>{ageSex}</span>}
                    {e.wgBudam != null && <span>부담 {e.wgBudam}kg</span>}
                    {hwBase != null && (
                      <span>
                        마체중 {hwBase}kg
                        {hwDelta != null && (
                          <span className={hwDelta > 0 ? ' text-stone-700' : hwDelta < 0 ? ' text-stone-500' : ''}>
                            {' '}({hwDelta >= 0 ? '+' : ''}{hwDelta})
                          </span>
                        )}
                      </span>
                    )}
                    {record !== '-' && <span>{record}</span>}
                    {recentStr !== '-' && <span>최근 {recentStr}</span>}
                    {e.equipment && <span>장구 {e.equipment}</span>}
                    {odds?.winOdds != null && (
                      <span className='text-emerald-700 font-medium'>단승 {odds.winOdds}</span>
                    )}
                    {odds?.plcOdds != null && (
                      <span className='text-teal-700 font-medium'>연승 {odds.plcOdds}</span>
                    )}
                  </div>
                </div>
                {onSelectHorse && isSelected?.(e.hrNo) && (
                  <Icon name='Check' size={20} className='shrink-0 text-primary-600' />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table layout */}
      <div className='hidden sm:block data-table-wrapper rounded-xl border border-border overflow-hidden shadow-sm'>
        <table className='data-table data-table-compact w-full'>
          <thead>
            <tr className='bg-stone-50 border-b border-border text-xs text-text-secondary'>
              <th className='cell-center py-3 w-10 font-semibold'>번호</th>
              <th className='text-left py-3 min-w-[90px] font-semibold'>마명</th>
              <th className='text-left py-3 font-semibold'>기수/조교사</th>
              <th className='text-left py-3 w-20 font-semibold'>마주</th>
              <th className='cell-center py-3 w-16 font-semibold'>
                <Tooltip content='산지(한/미/일) + 연령 + 성별(수/암/거)' inline>마령</Tooltip>
              </th>
              <th className='cell-center py-3 w-16 font-semibold'>
                <Tooltip content='기수 포함 경주 시 짊어지는 무게 (kg)' inline>부담</Tooltip>
              </th>
              <th className='cell-center py-3 w-16 font-semibold'>
                <Tooltip content='경주 당일 말의 체중. 괄호 안은 전 대비 증감' inline>마체중</Tooltip>
              </th>
              <th className='cell-center py-3 w-14 font-semibold'>
                <Tooltip content='KRA 능력 지표. 높을수록 경쟁력 우수' inline>레이팅</Tooltip>
              </th>
              <th className='cell-center py-3 w-20 font-semibold'>
                <Tooltip content='통산 출전 횟수와 1위 횟수' inline>통산</Tooltip>
              </th>
              <th className='cell-center py-3 w-24 font-semibold'>
                <Tooltip content='최근 5경기 착순 (1위=1, 미입상=0)' inline>최근</Tooltip>
              </th>
              <th className='text-left py-3 w-16 hidden md:table-cell font-semibold'>
                <Tooltip content='경주 시 말에 장착하는 보조 장비 (차안대, 혀묶개 등)' inline>장구</Tooltip>
              </th>
              {showOdds && (
                <th className='cell-center py-3 w-14 font-semibold'>
                  <Tooltip content='단승식 최종 배당률 (1위 적중 시 배당)' inline>단승</Tooltip>
                </th>
              )}
              {showOdds && (
                <th className='cell-center py-3 w-14 font-semibold'>
                  <Tooltip content='연승식 최종 배당률 (3위 내 적중 시 배당)' inline>연승</Tooltip>
                </th>
              )}
            </tr>
          </thead>
          <tbody className='divide-y divide-border'>
            {entries.map((e) => {
              const { base: hwBase, delta: hwDelta } = parseHorseWeight(e.horseWeight);
              const entryOdds = oddsMap?.get(e.hrNo);

              return (
                <tr
                  key={e.id ?? e.hrNo}
                  onClick={() => onSelectHorse?.(e.hrNo, e.hrName)}
                  className={`
                    transition-colors
                    ${onSelectHorse ? 'cursor-pointer hover:bg-stone-50' : ''}
                    ${isSelected?.(e.hrNo) ? 'bg-primary-50/50' : ''}
                  `}
                >
                  <td className='cell-center py-2.5'>
                    {e.chulNo != null ? (
                      <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-800 text-white text-xs font-bold'>
                        {e.chulNo}
                      </span>
                    ) : '-'}
                  </td>
                  <td className='py-2.5'>
                    <Link
                      href={horseProfileHref(e.hrNo, raceId)}
                      onClick={(ev) => ev.stopPropagation()}
                      className='font-semibold text-foreground hover:text-primary hover:underline'
                    >
                      {e.hrName}
                    </Link>
                  </td>
                  <td className='py-2.5 text-text-secondary text-sm'>
                    <span>{e.jkName ?? '-'}</span>
                    {e.trName && <span className='text-text-tertiary'> / {e.trName}</span>}
                  </td>
                  <td className='py-2.5 text-text-secondary text-sm'>
                    {e.owName ?? '-'}
                  </td>
                  <td className='cell-center py-2.5 text-sm text-text-secondary'>
                    {formatAgeSexOrigin(e.prd, e.age ?? undefined, e.sex)}
                  </td>
                  <td className='cell-center py-2.5 text-sm'>
                    {e.wgBudam != null ? <span className='font-medium'>{e.wgBudam}kg</span> : '-'}
                  </td>
                  <td className='cell-center py-2.5 text-sm'>
                    {hwBase != null ? (
                      <>
                        <span>{hwBase}kg</span>
                        {hwDelta != null && (
                          <span className={`ml-0.5 ${hwDelta > 0 ? 'text-stone-700' : hwDelta < 0 ? 'text-stone-500' : 'text-text-tertiary'}`}>
                            ({hwDelta >= 0 ? '+' : ''}{hwDelta})
                          </span>
                        )}
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className='cell-center py-2.5'>
                    {e.rating != null ? (
                      <span className='inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800'>
                        {e.rating}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className='cell-center py-2.5 text-sm text-text-secondary'>
                    {formatRecord(e.rcCntT, e.ord1CntT)}
                  </td>
                  <td className='cell-center py-2.5 text-xs text-text-tertiary'>
                    {formatRecentRanks(e.recentRanks)}
                  </td>
                  <td className='py-2.5 text-xs text-text-tertiary hidden md:table-cell'>
                    {e.equipment ?? '-'}
                  </td>
                  {showOdds && (
                    <td className='cell-center py-2.5 text-sm font-medium text-emerald-700'>
                      {entryOdds?.winOdds ?? '-'}
                    </td>
                  )}
                  {showOdds && (
                    <td className='cell-center py-2.5 text-sm font-medium text-teal-700'>
                      {entryOdds?.plcOdds ?? '-'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && (
        <div className='rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center'>
          <p className='text-text-secondary text-sm'>출전마 정보가 없습니다.</p>
          <p className='text-text-tertiary text-xs mt-1'>출전마 정보가 아직 등록되지 않았습니다.</p>
        </div>
      )}
    </div>
  );
}
