/**
 * 출전마 테이블 — 필수 정보만
 * No(게이트), 마명, 기수, 부담중량
 */
import { getGateBgColor } from './RaceHeaderCard';

/** 렌더링에 필요한 출전마 필드 */
export interface HorseEntryRow {
  id?: string | number;
  hrNo: string;
  hrName: string;
  jkName?: string;
  chulNo?: string;
  wgBudam?: number;
  horseWeight?: string;
}

/** horseWeight "502(-2)" → { delta: -2 } */
function parseHorseWeight(hw?: string): { base?: number; delta?: number } {
  if (!hw || typeof hw !== 'string') return {};
  const m = hw.match(/^(\d+)(\(([+-]?\d+)\))?$/);
  if (!m) return {};
  const base = parseInt(m[1], 10);
  const delta = m[3] != null ? parseInt(m[3], 10) : undefined;
  return { base, delta };
}

export interface HorseEntryTableProps {
  entries: HorseEntryRow[];
  onSelectHorse?: (hrNo: string, hrName: string) => void;
  isSelected?: (hrNo: string) => boolean;
}

export default function HorseEntryTable({ entries, onSelectHorse, isSelected }: HorseEntryTableProps) {
  return (
    <div className='data-table-wrapper'>
      <table className='data-table data-table-compact'>
        <thead>
          <tr>
            <th className='cell-center w-9'>No</th>
            <th className='min-w-[80px]'>마명</th>
            <th>기수</th>
            <th className='cell-center w-14'>부담</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const gateNo = parseInt(e.chulNo ?? '0', 10) || 0;
            const bgColor = getGateBgColor(gateNo);
            const isLight = ['#ffffff', '#fde047', '#facc15', '#38bdf8', '#84cc16', '#fde047'].includes(bgColor);
            const { delta } = parseHorseWeight(e.horseWeight);

            return (
              <tr
                key={e.id ?? e.hrNo}
                className={`${isSelected?.(e.hrNo) ? 'bg-primary/10' : ''} ${onSelectHorse ? 'cursor-pointer' : ''}`}
                onClick={() => onSelectHorse?.(e.hrNo, e.hrName)}
              >
                <td className='cell-center'>
                  <span
                    className='inline-flex items-center justify-center w-7 h-7 rounded font-bold text-sm'
                    style={{
                      backgroundColor: bgColor,
                      color: isLight ? '#171717' : '#fff',
                      border: isLight ? '1px solid #e5e7eb' : 'none',
                    }}
                  >
                    {e.chulNo ?? '-'}
                  </span>
                </td>
                <td className='font-medium text-foreground'>{e.hrName}</td>
                <td className='text-text-secondary'>{e.jkName}</td>
                <td className='cell-center'>
                  <span className='font-medium'>{e.wgBudam ?? '-'}</span>
                  {delta != null && (
                    <span className={delta > 0 ? 'text-red-600' : delta < 0 ? 'text-blue-600' : ''}>
                      {' '}({delta >= 0 ? '+' : ''}{delta})
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {entries.length === 0 && (
        <p className='text-text-secondary text-sm text-center py-6'>출전마 정보가 없습니다.</p>
      )}
    </div>
  );
}
