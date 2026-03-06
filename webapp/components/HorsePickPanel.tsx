/**
 * Horse selection panel — Sidebar (desktop) / Drawer (mobile) content
 * Bet type selection, selection history, horse list, save/delete
 */
import Icon from './icons';
import { SectionTitle } from './ui';
import {
  PICK_TYPE_LABELS,
  PICK_TYPE_DESCRIPTIONS,
  PICK_TYPE_HORSE_COUNTS,
  findDividendForPick,
} from '@/lib/api/picksApi';
import { trackCTA } from '@/lib/analytics';

const PICK_TYPES = [
  'SINGLE',
  'PLACE',
  'QUINELLA',
  'EXACTA',
  'QUINELLA_PLACE',
  'TRIFECTA',
  'TRIPLE',
];

interface HorsePickPanelProps {
  pickType: string;
  setPickType: (t: string) => void;
  selectedHorses: { hrNo: string; hrName: string }[];
  entries: {
    id?: string;
    hrNo: string;
    chulNo?: string;
    hrName: string;
    jkName?: string;
    wgBudam?: number;
    weight?: string;
  }[];
  requiredCount: number;
  dividends?: {
    poolName?: string;
    chulNo?: string;
    chulNo2?: string;
    chulNo3?: string;
    odds?: number;
  }[];
  onSelectHorse: (hrNo: string, hrName: string) => void;
  onSave: () => void;
  onDelete: () => void;
  hasPick: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  compact?: boolean;
}

export default function HorsePickPanel({
  pickType,
  setPickType,
  selectedHorses,
  entries,
  requiredCount,
  dividends,
  onSelectHorse,
  onSave,
  onDelete,
  hasPick,
  isSaving,
  isDeleting,
  compact = false,
}: HorsePickPanelProps) {
  const isHorseSelected = (hrNo: string) => selectedHorses.some((h) => h.hrNo === hrNo);
  const canSave = selectedHorses.length === requiredCount;
  const matchedOdds = findDividendForPick(dividends, pickType, selectedHorses);

  return (
    <div className='flex flex-col h-full'>
      {/* Bet type selection — compact scroll */}
      <div className='shrink-0'>
        <SectionTitle title='승식' icon='ClipboardList' as='h4' />
        <div
          className={`flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 ${
            compact ? 'flex-nowrap' : 'flex-wrap'
          }`}
          style={{ scrollbarWidth: 'none' }}
        >
          {PICK_TYPES.map((t) => {
            const isActive = pickType === t;
            const count = PICK_TYPE_HORSE_COUNTS[t];
            return (
              <button
                key={t}
                type='button'
                onClick={() => setPickType(t)}
                className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-card border border-border text-text-secondary hover:border-border-gold'
                }`}
              >
                {PICK_TYPE_LABELS[t]} ({count}마리)
              </button>
            );
          })}
        </div>
        <p className='text-text-tertiary text-xs mt-1'>{PICK_TYPE_DESCRIPTIONS[pickType]}</p>
      </div>

      {/* Selection history — always visible */}
      <div className='shrink-0 mt-4 p-3 rounded-xl bg-stone-50 border border-stone-200'>
        <h4 className='text-foreground text-sm font-semibold mb-2 flex items-center gap-1.5'>
          <Icon name='CheckCircle' size={16} />
          내가 고른 말 ({selectedHorses.length}/{requiredCount})
        </h4>
        {selectedHorses.length === 0 ? (
          <p className='text-text-secondary text-xs'>아래 출전마를 탭해서 선택하세요.</p>
        ) : (
          <>
            <div className='flex flex-wrap gap-1.5'>
              {selectedHorses.map((h, i) => (
                <span
                  key={`${h.hrNo}-${i}`}
                  className='inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-200 text-stone-700 text-xs font-medium'
                >
                  {requiredCount > 1 && <span className='text-text-tertiary'>{i + 1}.</span>}
                  {h.hrName}
                </span>
              ))}
            </div>
            {canSave && (
              <div className='mt-2 pt-2 border-t border-stone-200'>
                {matchedOdds != null ? (
                  <p className='text-stone-700 font-semibold text-sm'>
                    {PICK_TYPE_LABELS[pickType]} 배율 {matchedOdds.toLocaleString()}원
                  </p>
                ) : (dividends?.length ?? 0) > 0 ? (
                  <p className='text-text-tertiary text-xs'>해당 조합 배당 없음</p>
                ) : (
                  <p className='text-text-tertiary text-xs'>경주 결과 확정 후 배당 표시</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Horse list — scrollable area */}
      <div className='flex-1 min-h-0 mt-4'>
        <h4 className='text-foreground text-sm font-semibold mb-2'>출전마</h4>
        <div className='space-y-1.5 overflow-y-auto max-h-[40vh] lg:max-h-[300px] pr-1'>
          {entries.map((entry: { id?: string; hrNo: string; hrName: string; jkName?: string; chulNo?: string; wgBudam?: number; weight?: string; wgt?: string; trName?: string }) => {
            const selected = isHorseSelected(String(entry.hrNo));
            return (
              <button
                key={entry.id ?? entry.hrNo}
                type='button'
                onClick={() => onSelectHorse(String(entry.hrNo), entry.hrName)}
                disabled={isSaving || isDeleting}
                className={`w-full flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 p-2.5 sm:p-2 rounded-xl border text-left transition-colors touch-manipulation ${
                  selected
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-border bg-card hover:border-border-gold'
                }`}
              >
                <div className='flex items-center gap-2 flex-1 min-w-0'>
                  <span className='font-medium flex-1 truncate'>{entry.hrName}</span>
                  {selected && <Icon name='Check' size={14} className='shrink-0' />}
                </div>
                <div className='flex items-center gap-2 text-text-secondary text-xs sm:text-xs pl-9 sm:pl-0 flex-wrap'>
                  <span>{entry.jkName ?? '-'}</span>
                  <span className='text-text-tertiary'>
                    {entry.wgBudam ?? (entry as { weight?: string; wgt?: string }).weight ?? (entry as { wgt?: string }).wgt ?? '-'}kg
                  </span>
                  {entry.trName && (
                    <span className='text-text-tertiary hidden md:inline'>· {entry.trName}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save/Delete */}
      <div className='shrink-0 mt-4 flex gap-2'>
        {canSave && (
          <button
            onClick={() => {
              trackCTA('PICK_SAVE', pickType);
              onSave();
            }}
            disabled={isSaving}
            className='btn-primary flex-1 py-1.5 text-sm flex items-center justify-center gap-1'
          >
            {isSaving ? (
              <>
                <Icon name='Loader2' size={16} className='animate-spin' />
                저장 중...
              </>
            ) : (
              <>{hasPick ? '수정' : '저장'}</>
            )}
          </button>
        )}
        {hasPick && (
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className='btn-secondary py-1.5 px-3 text-sm flex items-center gap-1'
          >
            <Icon name='Trash2' size={14} />
            삭제
          </button>
        )}
      </div>
    </div>
  );
}
