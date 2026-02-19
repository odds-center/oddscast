/**
 * 출전마 테이블 — 풍부한 정보 + 세련된 UI
 * No(게이트), 마명, 기수/조교사, 마령·산지, 부담중량, 마체중, 레이팅, 통산, 최근등수
 */
import { getGateBgColor } from './RaceHeaderCard';
import Icon from '@/components/icons';

/** 렌더링에 필요한 출전마 필드 */
export interface HorseEntryRow {
  id?: string | number;
  hrNo: string;
  hrName: string;
  jkName?: string;
  trName?: string;
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

/** horseWeight "502(-2)" → { base: 502, delta: -2 } (마체중 kg, 전 대비 증감) */
function parseHorseWeight(hw?: string): { base?: number; delta?: number } {
  if (!hw || typeof hw !== 'string') return {};
  const m = hw.match(/^(\d+)(\(([+-]?\d+)\))?$/);
  if (!m) return {};
  const base = parseInt(m[1], 10);
  const delta = m[3] != null ? parseInt(m[3], 10) : undefined;
  return { base, delta };
}

/** 마령·산지 포맷: prd(산지)+age(연령)+sex(성별) → 한4수, 미3암 */
function formatAgeSexOrigin(prd?: string, age?: number, sex?: string): string {
  const parts: string[] = [];
  const prdMap: Record<string, string> = { 한국: '한', 미국: '미', 일본: '일', 아일랜드: '아', 영국: '영' };
  if (prd) parts.push(prdMap[prd] ?? prd.slice(0, 1));
  if (age != null) parts.push(String(age));
  if (sex) parts.push(sex === '수' ? '수' : sex === '암' ? '암' : sex === '거' ? '거' : sex);
  return parts.length ? parts.join('') : '-';
}

/** 통산 포맷: rcCntT, ord1CntT → "20전 3승" */
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
}

export default function HorseEntryTable({ entries, onSelectHorse, isSelected }: HorseEntryTableProps) {
  return (
    <div className='space-y-2 sm:space-y-0'>
      {/* 모바일: 카드형 */}
      <div className='block sm:hidden space-y-2'>
        {entries.map((e) => {
          const gateNo = parseInt(e.chulNo ?? '0', 10) || 0;
          const bgColor = getGateBgColor(gateNo);
          const isLight = ['#ffffff', '#fde047', '#facc15', '#38bdf8', '#84cc16', '#fde047'].includes(bgColor);
          const { base: hwBase, delta: hwDelta } = parseHorseWeight(e.horseWeight);
          const ageSex = formatAgeSexOrigin(e.prd, e.age ?? undefined, e.sex);
          const record = formatRecord(e.rcCntT, e.ord1CntT);
          const recentStr = formatRecentRanks(e.recentRanks);

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
                ${isSelected?.(e.hrNo) ? 'ring-2 ring-primary-500 border-primary-400 bg-primary-50/30' : 'border-border bg-card hover:border-slate-300'}
              `}
            >
              <div className='flex items-start gap-3 p-4'>
                <span
                  className='shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg font-bold text-sm shadow-sm'
                  style={{
                    backgroundColor: bgColor,
                    color: isLight ? '#171717' : '#fff',
                    border: isLight ? '1px solid #e5e7eb' : 'none',
                  }}
                >
                  {e.chulNo ?? '-'}
                </span>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className='font-semibold text-foreground'>{e.hrName}</span>
                    {e.rating != null && (
                      <span className='inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800'>
                        R{e.rating}
                      </span>
                    )}
                  </div>
                  <div className='flex items-center gap-2 mt-0.5 text-text-secondary text-sm'>
                    {e.jkName && <span>{e.jkName}</span>}
                    {e.trName && <span className='text-text-tertiary'>/ {e.trName}</span>}
                  </div>
                  <div className='flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-text-tertiary'>
                    {ageSex !== '-' && <span>{ageSex}</span>}
                    {e.wgBudam != null && <span>부담 {e.wgBudam}kg</span>}
                    {hwBase != null && (
                      <span>
                        마체중 {hwBase}kg
                        {hwDelta != null && (
                          <span className={hwDelta > 0 ? ' text-red-600' : hwDelta < 0 ? ' text-blue-600' : ''}>
                            {' '}({hwDelta >= 0 ? '+' : ''}{hwDelta})
                          </span>
                        )}
                      </span>
                    )}
                    {record !== '-' && <span>{record}</span>}
                    {recentStr !== '-' && <span>최근 {recentStr}</span>}
                    {e.equipment && <span>장구 {e.equipment}</span>}
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

      {/* 데스크톱: 테이블형 */}
      <div className='hidden sm:block data-table-wrapper rounded-xl border border-border overflow-hidden shadow-sm'>
        <table className='data-table data-table-compact w-full'>
          <thead>
            <tr className='bg-slate-50 border-b border-border'>
              <th className='cell-center w-10 py-3'>No</th>
              <th className='text-left py-3 min-w-[90px]'>마명</th>
              <th className='text-left py-3'>기수/조교사</th>
              <th className='cell-center py-3 w-16' title='산지·연령·성별'>마령</th>
              <th className='cell-center py-3 w-16' title='말이 짊어지는 무게'>부담</th>
              <th className='cell-center py-3 w-16' title='말의 몸무게'>마체중</th>
              <th className='cell-center py-3 w-14'>레이팅</th>
              <th className='cell-center py-3 w-20'>통산</th>
              <th className='cell-center py-3 w-24'>최근</th>
              <th className='text-left py-3 w-16 hidden md:table-cell'>장구</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-border'>
            {entries.map((e) => {
              const gateNo = parseInt(e.chulNo ?? '0', 10) || 0;
              const bgColor = getGateBgColor(gateNo);
              const isLight = ['#ffffff', '#fde047', '#facc15', '#38bdf8', '#84cc16', '#fde047'].includes(bgColor);
              const { base: hwBase, delta: hwDelta } = parseHorseWeight(e.horseWeight);

              return (
                <tr
                  key={e.id ?? e.hrNo}
                  onClick={() => onSelectHorse?.(e.hrNo, e.hrName)}
                  className={`
                    transition-colors
                    ${onSelectHorse ? 'cursor-pointer hover:bg-slate-50' : ''}
                    ${isSelected?.(e.hrNo) ? 'bg-primary-50/50' : ''}
                  `}
                >
                  <td className='cell-center py-2.5'>
                    <span
                      className='inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm'
                      style={{
                        backgroundColor: bgColor,
                        color: isLight ? '#171717' : '#fff',
                        border: isLight ? '1px solid #e5e7eb' : 'none',
                      }}
                    >
                      {e.chulNo ?? '-'}
                    </span>
                  </td>
                  <td className='py-2.5'>
                    <span className='font-semibold text-foreground'>{e.hrName}</span>
                  </td>
                  <td className='py-2.5 text-text-secondary text-sm'>
                    <span>{e.jkName ?? '-'}</span>
                    {e.trName && <span className='text-text-tertiary'> / {e.trName}</span>}
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
                          <span className={`ml-0.5 ${hwDelta > 0 ? 'text-red-600' : hwDelta < 0 ? 'text-blue-600' : 'text-text-tertiary'}`}>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && (
        <div className='rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center'>
          <p className='text-text-secondary text-sm'>출전마 정보가 없습니다.</p>
          <p className='text-text-tertiary text-xs mt-1'>KRA 출전표 적재 후 표시됩니다.</p>
        </div>
      )}
    </div>
  );
}
