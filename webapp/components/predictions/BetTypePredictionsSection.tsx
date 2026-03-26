/**
 * AI prediction section by bet type
 * compact (default): 3 core recommended bet cards (single, quinella, triple)
 * full: complete table of 7 bet types
 */
import { ArrowRight, Circle } from 'lucide-react';
const PICK_TYPE_POOL_NAMES: Record<string, string> = {
  SINGLE: '단승', PLACE: '연승', QUINELLA: '복승',
  EXACTA: '쌍승', QUINELLA_PLACE: '복연승', TRIFECTA: '삼복승', TRIPLE: '삼쌍승',
};
const PICK_TYPE_COMBO_DESC: Record<string, string> = {
  SINGLE: '1착 예측', PLACE: '1~3착 중 1두', QUINELLA: '1·2착 (순서 무관)',
  EXACTA: '1·2착 (순서 적중)', QUINELLA_PLACE: '1·2·3착 중 2두',
  TRIFECTA: '1·2·3착 (순서 무관)', TRIPLE: '1·2·3착 (순서 적중)',
};
import type { BetTypePredictions, PredictionHorseScore } from '@/lib/types/predictions';

const BET_TYPE_ORDER: (keyof BetTypePredictions)[] = [
  'SINGLE', 'PLACE', 'QUINELLA', 'EXACTA', 'QUINELLA_PLACE', 'TRIFECTA', 'TRIPLE',
];


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
  /** AI analysis text to display below the bet type grid */
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
  // Prefer chulNo as the display identifier — it's the race entry number shown to bettors
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

const BET_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  SINGLE:        { bg: 'bg-[rgba(22,163,74,0.04)]',  border: 'border-[rgba(22,163,74,0.2)]',  badge: 'bg-[#16a34a] text-white' },
  PLACE:         { bg: 'bg-[rgba(22,163,74,0.02)]',  border: 'border-[rgba(22,163,74,0.12)]', badge: 'bg-[#15803d] text-white' },
  QUINELLA:      { bg: 'bg-blue-50/60',               border: 'border-blue-200',                badge: 'bg-blue-600 text-white' },
  EXACTA:        { bg: 'bg-blue-50/30',               border: 'border-blue-200/70',             badge: 'bg-blue-500 text-white' },
  QUINELLA_PLACE:{ bg: 'bg-violet-50/50',             border: 'border-violet-200',              badge: 'bg-violet-600 text-white' },
  TRIFECTA:      { bg: 'bg-amber-50/50',              border: 'border-amber-200',               badge: 'bg-amber-600 text-white' },
  TRIPLE:        { bg: 'bg-rose-50/50',               border: 'border-rose-200',                badge: 'bg-rose-600 text-white' },
};

function NumberBadge({ num, chulNo, ordered, isLast }: { num: string; chulNo?: string; ordered: boolean; isLast: boolean }) {
  return (
    <span className='inline-flex items-center gap-1'>
      <span className='inline-flex items-center gap-1'>
        {chulNo != null && (
          <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-700 text-white text-[11px] font-bold shrink-0'>
            {chulNo}
          </span>
        )}
        <span className='font-medium text-foreground text-sm'>{num}</span>
      </span>
      {!isLast && (
        ordered
          ? <ArrowRight size={14} className='text-stone-500 shrink-0' strokeWidth={2.5} />
          : <Circle size={4} className='text-stone-300 fill-stone-300 shrink-0' />
      )}
    </span>
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
        <div className='flex items-center gap-3 p-3 rounded border border-[rgba(22,163,74,0.15)] bg-[rgba(22,163,74,0.04)]'>
          <span className='text-sm font-semibold px-2 py-0.5 rounded bg-[#16a34a] text-white'>단승</span>
          {(name || nodesList[0]) && (
            <span className='inline-flex items-center gap-1.5 font-bold text-foreground text-base'>
              {singleEntry?.chulNo != null && (
                <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-700 text-white text-xs font-bold shrink-0'>
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

  // All 7 bet type cards
  const allItems = BET_TYPE_ORDER.map((key) => {
    const pred = merged[key];
    const nodesList = pred ? predToDisplayNodesList(pred, entries) : [];
    const reason = getReason(pred);
    const colors = BET_COLORS[key] ?? BET_COLORS.SINGLE;
    return { key, label: PICK_TYPE_POOL_NAMES[key] ?? key, desc: PICK_TYPE_COMBO_DESC[key] ?? '', nodesList, reason, colors };
  });

  return (
    <div className='space-y-3'>
      <p className='text-text-secondary text-sm font-semibold'>AI 도출 승식</p>
      <p className='text-text-tertiary text-xs'>승식별로 AI가 도출한 추천 출전번호·말과 도출 근거입니다.</p>

      {/* All 7 bet type cards */}
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2'>
        {allItems.map((item) => (
          <div
            key={item.key}
            className={`rounded border ${item.colors.border} ${item.colors.bg} p-3 flex flex-col gap-2`}
          >
            <div className='flex items-center gap-1.5 flex-wrap'>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${item.colors.badge}`}>
                {item.label}
              </span>
              <span className='text-text-secondary text-xs'>{item.desc}</span>
            </div>
            {item.nodesList.length > 0 ? (
              <div className='flex flex-col gap-1'>
                {item.nodesList.map((nodes, ci) => (
                  <div key={ci} className='flex items-center gap-1 flex-wrap'>
                    {nodes.numbers.map((num, i) => {
                      const e = entries.find((x) => String(x.hrNo || '').trim() === num.trim() || String(x.chulNo || '').trim() === num.trim());
                      return (
                        <NumberBadge key={i} num={e?.hrName || num} chulNo={e?.chulNo} ordered={nodes.ordered} isLast={i === nodes.numbers.length - 1} />
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <span className='text-text-tertiary text-sm'>—</span>
            )}
            {item.reason && (
              <p className='text-text-tertiary text-xs leading-snug mt-0.5 line-clamp-2'>{item.reason}</p>
            )}
          </div>
        ))}
      </div>

      {/* AI analysis comment */}
      {analysis && (
        <div className='rounded border border-stone-200 bg-stone-50 p-3'>
          <p className='text-xs font-semibold text-stone-500 mb-1'>AI 분석 코멘트</p>
          <p className='text-sm text-foreground leading-relaxed whitespace-pre-wrap'>{analysis}</p>
        </div>
      )}
    </div>
  );
}
