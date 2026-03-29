/**
 * AI prediction section by bet type
 * Compact card layout with clear visual hierarchy
 */
import { ArrowRight } from 'lucide-react';
import type { BetTypePredictions, PredictionHorseScore } from '@/lib/types/predictions';

const PICK_TYPE_POOL_NAMES: Record<string, string> = {
  SINGLE: '단승', PLACE: '연승', QUINELLA: '복승',
  EXACTA: '쌍승', QUINELLA_PLACE: '복연승', TRIFECTA: '삼복승', TRIPLE: '삼쌍승',
};
const PICK_TYPE_COMBO_DESC: Record<string, string> = {
  SINGLE: '1마리 1등', PLACE: '1~3착 중 1두', QUINELLA: '1·2착 (순서 무관)',
  EXACTA: '1·2착 (순서 적중)', QUINELLA_PLACE: '1·2·3착 중 2두',
  TRIFECTA: '1·2·3착 (순서 무관)', TRIPLE: '1·2·3착 (순서 적중)',
};

const BET_TYPE_ORDER: (keyof BetTypePredictions)[] = [
  'SINGLE', 'PLACE', 'QUINELLA', 'EXACTA', 'QUINELLA_PLACE', 'TRIFECTA', 'TRIPLE',
];

// Group: top row (2 simple), bottom row (2 pair), then 3 triple
const TOP_ROW: (keyof BetTypePredictions)[] = ['SINGLE', 'PLACE', 'QUINELLA', 'EXACTA'];
const BOTTOM_ROW: (keyof BetTypePredictions)[] = ['QUINELLA_PLACE', 'TRIFECTA', 'TRIPLE'];

interface Entry {
  hrNo: string;
  hrName?: string;
  chulNo?: string;
}

interface BetTypePredictionsSectionProps {
  betTypePredictions?: BetTypePredictions | null;
  horseScores?: PredictionHorseScore[];
  entries: Entry[];
  showOnlySingle?: boolean;
  analysis?: string;
}

function toHorseNoOnly(hrNoOrChulNo: string, entries: Entry[]): string {
  const v = String(hrNoOrChulNo).trim();
  if (!v) return '';
  const e = entries.find(
    (x) =>
      String(x.hrNo || '').trim() === v || String(x.chulNo || '').trim() === v,
  );
  if (!e) return v;
  return (e.chulNo ?? (e.hrNo && e.hrNo.length <= 2 ? e.hrNo : '')) || v;
}

function toHorseName(hrNoOrChulNo: string, entries: Entry[]): string {
  const v = String(hrNoOrChulNo).trim();
  const e = entries.find(
    (x) =>
      String(x.hrNo || '').trim() === v || String(x.chulNo || '').trim() === v,
  );
  return e?.hrName ?? '';
}

export function deriveFromHorseScores(
  horseScores: PredictionHorseScore[],
  entries: Entry[],
): BetTypePredictions {
  const id = (h: PredictionHorseScore) => (h?.chulNo ?? h?.hrNo ?? '').toString().trim();
  const sorted = [...horseScores]
    .filter((h) => id(h))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  let ids = sorted.map((h) => id(h)).filter(Boolean);
  if (ids.length < 4) {
    ids = [
      ...ids,
      ...entries.slice(ids.length, 6).map((e) => e.chulNo ?? e.hrNo ?? '').filter(Boolean),
    ];
  }
  const [a, b, c, d] = ids;
  if (!a) return {};

  const pairCombos = b && c
    ? [{ hrNos: [a, b] as [string, string] }, { hrNos: [a, c] as [string, string] }, { hrNos: [b, c] as [string, string] }]
    : b ? [{ hrNos: [a, b] as [string, string] }] : [];
  const exactaCombos = b && c
    ? [{ first: a, second: b }, { first: a, second: c }, { first: b, second: a }]
    : b ? [{ first: a, second: b }] : [];
  const tripleCombos = a && b && c && d
    ? [{ hrNos: [a, b, c] as [string, string, string] }, { hrNos: [a, b, d] as [string, string, string] }, { hrNos: [a, c, d] as [string, string, string] }]
    : a && b && c ? [{ hrNos: [a, b, c] as [string, string, string] }] : [];
  const tripleExactCombos = a && b && c && d
    ? [{ first: a, second: b, third: c }, { first: a, second: b, third: d }, { first: a, second: c, third: b }]
    : a && b && c ? [{ first: a, second: b, third: c }] : [];

  return {
    SINGLE: { hrNo: a, reason: '1등 예상' },
    PLACE: { hrNo: a, reason: '1~3등 안정' },
    QUINELLA: pairCombos.length ? { combinations: pairCombos } : undefined,
    EXACTA: exactaCombos.length ? { combinations: exactaCombos } : undefined,
    QUINELLA_PLACE: pairCombos.length ? { combinations: pairCombos } : undefined,
    TRIFECTA: tripleCombos.length ? { combinations: tripleCombos } : undefined,
    TRIPLE: tripleExactCombos.length ? { combinations: tripleExactCombos } : undefined,
  };
}

export type DisplayNodes = { numbers: string[]; ordered: boolean };

function comboToDisplayNodes(
  combo: { hrNo?: string; hrNos?: string[]; first?: string; second?: string; third?: string },
  entries: Entry[],
): DisplayNodes | null {
  if (!combo) return null;
  if (combo.hrNo) {
    const n = toHorseNoOnly(combo.hrNo, entries);
    return n ? { numbers: [n], ordered: false } : null;
  }
  if (Array.isArray(combo.hrNos)) {
    const nums = combo.hrNos.map((h: string) => toHorseNoOnly(h, entries)).filter(Boolean);
    return nums.length ? { numbers: nums, ordered: false } : null;
  }
  if (combo.first != null && combo.second != null) {
    const arr: string[] = [combo.first, combo.second];
    if (combo.third) arr.push(combo.third);
    const nums = arr.map((h: string) => toHorseNoOnly(h, entries)).filter(Boolean);
    return nums.length ? { numbers: nums, ordered: true } : null;
  }
  return null;
}

export function predToDisplayNodesList(
  pred: BetTypePredictions[keyof BetTypePredictions],
  entries: Entry[],
): DisplayNodes[] {
  if (!pred) return [];
  if ('combinations' in pred && Array.isArray(pred.combinations)) {
    return pred.combinations
      .slice(0, 3)
      .map((c) => comboToDisplayNodes(c as { hrNo?: string; hrNos?: string[]; first?: string; second?: string; third?: string }, entries))
      .filter((n): n is DisplayNodes => n != null);
  }
  const single = comboToDisplayNodes(
    pred as { hrNo?: string; hrNos?: string[]; first?: string; second?: string; third?: string },
    entries,
  );
  return single ? [single] : [];
}

function getReason(pred: BetTypePredictions[keyof BetTypePredictions]): string {
  if (!pred) return '';
  if ('reason' in pred && pred.reason) return pred.reason;
  return '';
}

function getFirstHrNo(pred: BetTypePredictions[keyof BetTypePredictions]): string {
  if (!pred) return '';
  if ('hrNo' in pred && pred.hrNo) return pred.hrNo;
  if ('first' in pred && pred.first) return pred.first;
  if ('combinations' in pred && pred.combinations?.[0]) {
    const c = pred.combinations[0] as { hrNo?: string; first?: string; hrNos?: string[] };
    return c.hrNo ?? c.first ?? c.hrNos?.[0] ?? '';
  }
  return '';
}

const BET_BADGE_COLORS: Record<string, string> = {
  SINGLE: 'bg-emerald-600 text-white',
  PLACE: 'bg-emerald-500 text-white',
  QUINELLA: 'bg-blue-500 text-white',
  EXACTA: 'bg-blue-600 text-white',
  QUINELLA_PLACE: 'bg-violet-500 text-white',
  TRIFECTA: 'bg-amber-500 text-white',
  TRIPLE: 'bg-rose-500 text-white',
};

/** Compact horse number chip */
function HorseChip({ num, name, entries }: { num: string; name?: string; entries: Entry[] }) {
  const e = entries.find((x) => String(x.hrNo || '').trim() === num.trim() || String(x.chulNo || '').trim() === num.trim());
  const displayNo = e?.chulNo ?? num;
  const displayName = name ?? e?.hrName ?? '';
  return (
    <span className='inline-flex items-center gap-1'>
      <span className='inline-flex items-center justify-center w-5.5 h-5.5 rounded-full bg-stone-800 text-white text-[10px] font-bold shrink-0 leading-none'>
        {displayNo}
      </span>
      {displayName && <span className='text-xs font-medium text-foreground'>{displayName}</span>}
    </span>
  );
}

/** Combination row with horse chips and arrows */
function ComboRow({ nodes, entries }: { nodes: DisplayNodes; entries: Entry[] }) {
  return (
    <div className='flex items-center gap-1 flex-wrap'>
      {nodes.numbers.map((num, i) => (
        <span key={i} className='inline-flex items-center gap-1'>
          <HorseChip num={num} entries={entries} />
          {i < nodes.numbers.length - 1 && (
            nodes.ordered
              ? <ArrowRight size={12} className='text-stone-400 shrink-0' strokeWidth={2.5} />
              : <span className='text-stone-300 text-[10px] shrink-0'>·</span>
          )}
        </span>
      ))}
    </div>
  );
}

export default function BetTypePredictionsSection({
  betTypePredictions,
  horseScores,
  entries,
  showOnlySingle = false,
  analysis,
}: BetTypePredictionsSectionProps) {
  const derived = horseScores?.length || entries.length
    ? deriveFromHorseScores(horseScores ?? [], entries)
    : {};
  const merged: BetTypePredictions = {
    SINGLE: betTypePredictions?.SINGLE ?? derived.SINGLE,
    PLACE: betTypePredictions?.PLACE ?? derived.PLACE,
    QUINELLA: betTypePredictions?.QUINELLA ?? derived.QUINELLA,
    EXACTA: betTypePredictions?.EXACTA ?? derived.EXACTA,
    QUINELLA_PLACE: betTypePredictions?.QUINELLA_PLACE ?? derived.QUINELLA_PLACE,
    TRIFECTA: betTypePredictions?.TRIFECTA ?? derived.TRIFECTA,
    TRIPLE: betTypePredictions?.TRIPLE ?? derived.TRIPLE,
  };

  if (showOnlySingle) {
    const pred = merged.SINGLE;
    const nodesList = pred ? predToDisplayNodesList(pred, entries) : [];
    const hrNo = getFirstHrNo(pred);
    const name = hrNo ? toHorseName(hrNo, entries) : '';
    const singleEntry = hrNo ? entries.find((x) => String(x.hrNo || '').trim() === hrNo.trim() || String(x.chulNo || '').trim() === hrNo.trim()) : undefined;
    return (
      <div className='py-2'>
        <div className='flex items-center gap-3 p-3 rounded-lg border border-emerald-200/60 bg-emerald-50/30'>
          <span className='text-xs font-bold px-2 py-1 rounded bg-emerald-600 text-white'>단승</span>
          {(name || nodesList[0]) && (
            <span className='inline-flex items-center gap-1.5 font-bold text-foreground text-sm'>
              {singleEntry?.chulNo != null && (
                <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-800 text-white text-[11px] font-bold shrink-0'>
                  {singleEntry.chulNo}
                </span>
              )}
              {name || nodesList[0]?.numbers[0]}
            </span>
          )}
        </div>
      </div>
    );
  }

  const allItems = BET_TYPE_ORDER.map((key) => {
    const pred = merged[key];
    const nodesList = pred ? predToDisplayNodesList(pred, entries) : [];
    const reason = getReason(pred);
    const badgeColor = BET_BADGE_COLORS[key] ?? BET_BADGE_COLORS.SINGLE;
    return { key, label: PICK_TYPE_POOL_NAMES[key] ?? key, desc: PICK_TYPE_COMBO_DESC[key] ?? '', nodesList, reason, badgeColor };
  });

  const topItems = allItems.filter((item) => TOP_ROW.includes(item.key as keyof BetTypePredictions));
  const bottomItems = allItems.filter((item) => BOTTOM_ROW.includes(item.key as keyof BetTypePredictions));

  return (
    <div>
      <div className='flex items-center gap-2 mb-2'>
        <div className='w-1 h-4 rounded-full bg-blue-500' />
        <p className='text-sm text-foreground font-semibold'>AI 도출 승식</p>
        <span className='text-[11px] text-text-tertiary'>승식별 추천 조합</span>
      </div>

      <div className='rounded-xl border border-border overflow-hidden shadow-sm'>
        {/* Top: 2-column grid for simple types */}
        <div className='grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/50'>
          {topItems.map((item) => (
            <div key={item.key} className='p-3 space-y-1.5'>
              <div className='flex items-center gap-1.5'>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                  {item.label}
                </span>
                <span className='text-[10px] text-text-tertiary hidden sm:inline'>{item.desc}</span>
              </div>
              {item.nodesList.length > 0 ? (
                <div className='space-y-1'>
                  {item.nodesList.map((nodes, ci) => (
                    <ComboRow key={ci} nodes={nodes} entries={entries} />
                  ))}
                </div>
              ) : (
                <span className='text-text-tertiary text-xs'>—</span>
              )}
              {item.reason && (
                <p className='text-[10px] text-text-tertiary line-clamp-1'>{item.reason}</p>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className='border-t border-border/50' />

        {/* Bottom: 3-column for complex types */}
        <div className='grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/50'>
          {bottomItems.map((item) => (
            <div key={item.key} className='p-3 space-y-1.5'>
              <div className='flex items-center gap-1.5 mb-1'>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                  {item.label}
                </span>
                <span className='text-[10px] text-text-tertiary'>{item.desc}</span>
              </div>
              {item.nodesList.length > 0 ? (
                <div className='space-y-1'>
                  {item.nodesList.map((nodes, ci) => (
                    <ComboRow key={ci} nodes={nodes} entries={entries} />
                  ))}
                </div>
              ) : (
                <span className='text-text-tertiary text-xs'>—</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {analysis && (
        <div className='rounded-lg border border-stone-200 bg-stone-50 p-3 mt-3'>
          <p className='text-xs font-semibold text-stone-500 mb-1'>AI 분석 코멘트</p>
          <p className='text-sm text-foreground leading-relaxed whitespace-pre-wrap'>{analysis}</p>
        </div>
      )}
    </div>
  );
}
