/**
 * 승식별 AI 예측 섹션
 * compact(기본): 핵심 3가지 추천식 카드 (단승, 연승, 삼쌍)
 * full: 7개 승식 전체 테이블
 */
import { ArrowRight, Circle } from 'lucide-react';
import { PICK_TYPE_POOL_NAMES, PICK_TYPE_COMBO_DESC, PICK_TYPE_DESCRIPTIONS } from '@/lib/api/picksApi';
import { Tooltip } from '@/components/ui';
import type { BetTypePredictions, PredictionHorseScore } from '@/lib/types/predictions';

const BET_TYPE_ORDER: (keyof BetTypePredictions)[] = [
  'SINGLE', 'PLACE', 'QUINELLA', 'EXACTA', 'QUINELLA_PLACE', 'TRIFECTA', 'TRIPLE',
];

const TOP_3_BET_TYPES: (keyof BetTypePredictions)[] = ['SINGLE', 'QUINELLA', 'TRIPLE'];

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

function deriveFromHorseScores(
  horseScores: PredictionHorseScore[],
  entries: Entry[],
): BetTypePredictions {
  const id = (h: PredictionHorseScore) => (h?.hrNo ?? h?.chulNo ?? '').toString().trim();
  const sorted = [...horseScores]
    .filter((h) => id(h))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  let ids = sorted.map((h) => id(h)).filter(Boolean);
  if (ids.length < 4) {
    ids = [
      ...ids,
      ...entries.slice(ids.length, 6).map((e) => e.hrNo ?? e.chulNo ?? '').filter(Boolean),
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

type DisplayNodes = { numbers: string[]; ordered: boolean };

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

function predToDisplayNodesList(
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
  SINGLE: { bg: 'bg-[rgba(146,112,42,0.04)]', border: 'border-[rgba(146,112,42,0.15)]', badge: 'bg-[#92702A] text-white' },
  QUINELLA: { bg: 'bg-stone-50', border: 'border-stone-200', badge: 'bg-stone-700 text-white' },
  TRIPLE: { bg: 'bg-stone-50', border: 'border-stone-200', badge: 'bg-stone-500 text-white' },
};

function NumberBadge({ num, ordered, isLast }: { num: string; ordered: boolean; isLast: boolean }) {
  return (
    <span className='inline-flex items-center gap-1'>
          <span className='inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded bg-white border border-stone-200 text-foreground font-bold text-sm'>
        {num}
      </span>
      {!isLast && (
        ordered
          ? <ArrowRight size={12} className='text-stone-400 shrink-0' strokeWidth={2.5} />
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
    return (
      <div className='py-2'>
        <div className='flex items-center gap-3 p-3 rounded border border-[rgba(146,112,42,0.15)] bg-[rgba(146,112,42,0.04)]'>
          <span className='text-sm font-semibold px-2 py-0.5 rounded bg-[#92702A] text-white'>단승</span>
          {nodesList[0] && (
            <span className='font-bold text-foreground text-base'>{nodesList[0].numbers[0]}번</span>
          )}
          {name && <span className='text-stone-500 text-sm'>{name}</span>}
        </div>
      </div>
    );
  }

  // 핵심 3가지 추천식 카드
  const top3Items = TOP_3_BET_TYPES.map((key) => {
    const pred = merged[key];
    const nodesList = pred ? predToDisplayNodesList(pred, entries) : [];
    const reason = getReason(pred);
    const colors = BET_COLORS[key] ?? BET_COLORS.SINGLE;
    return { key, label: PICK_TYPE_POOL_NAMES[key] ?? key, desc: PICK_TYPE_COMBO_DESC[key] ?? '', nodesList, reason, colors };
  });

  // 나머지 4개 승식 (접기 가능)
  const restKeys = BET_TYPE_ORDER.filter((k) => !TOP_3_BET_TYPES.includes(k));
  const restItems = restKeys.map((key) => {
    const pred = merged[key];
    const nodesList = pred ? predToDisplayNodesList(pred, entries) : [];
    return { key, label: PICK_TYPE_POOL_NAMES[key] ?? key, comboDesc: PICK_TYPE_COMBO_DESC[key] ?? '', nodesList };
  });

  return (
    <div className='space-y-3'>
      <p className='text-text-secondary text-sm font-semibold'>AI 추천 승식</p>

      {/* 핵심 3가지 카드 */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-2.5'>
        {top3Items.map((item) => (
          <div
            key={item.key}
            className={`rounded border ${item.colors.border} ${item.colors.bg} p-3 flex flex-col gap-2`}
          >
            <div className='flex items-center gap-2'>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${item.colors.badge}`}>
                {item.label}
              </span>
              <span className='text-text-secondary text-sm'>{item.desc}</span>
            </div>
            {item.nodesList.length > 0 ? (
              <div className='flex flex-col gap-1.5'>
                {item.nodesList.map((nodes, ci) => (
                  <div key={ci} className='flex items-center gap-1'>
                    {nodes.numbers.map((num, i) => (
                      <NumberBadge key={i} num={num} ordered={nodes.ordered} isLast={i === nodes.numbers.length - 1} />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <span className='text-text-tertiary text-sm'>—</span>
            )}
            {item.reason && (
              <p className='text-text-secondary text-sm leading-snug mt-0.5 line-clamp-2'>{item.reason}</p>
            )}
          </div>
        ))}
      </div>

      {/* 나머지 승식 — 아코디언 없이 바로 표시 */}
      <div className='overflow-x-auto rounded-lg border border-border'>
        <table className='data-table data-table-compact w-full min-w-[300px]'>
          <thead>
            <tr>
              <th className='w-24 text-left py-2 text-sm'>승식</th>
              <th className='text-left py-2 text-sm'>추천 조합</th>
            </tr>
          </thead>
          <tbody>
            {restItems.map((item) => (
              <tr key={item.key} className='border-t border-border'>
                <td className='py-2.5 font-medium text-foreground text-sm'>
                  <Tooltip content={PICK_TYPE_DESCRIPTIONS[item.key] ?? item.comboDesc} inline position='right'>
                    {item.label}
                  </Tooltip>
                </td>
                <td className='py-2.5'>
                  {item.nodesList.length > 0 ? (
                    <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                      {item.nodesList.map((nodes, ci) => (
                        <span key={ci} className='inline-flex items-center gap-0.5'>
                          {nodes.numbers.map((num, i) => (
                            <span key={i} className='flex items-center gap-0.5'>
                              <span className='inline-flex items-center justify-center min-w-6 h-6 px-1 rounded bg-stone-100 text-stone-700 font-bold text-sm'>
                                {num}
                              </span>
                              {i < nodes.numbers.length - 1 && (
                                nodes.ordered
                                  ? <ArrowRight size={14} className='text-text-tertiary shrink-0' strokeWidth={2.5} />
                                  : <Circle size={5} className='text-text-tertiary fill-text-tertiary shrink-0' />
                              )}
                            </span>
                          ))}
                          {ci < item.nodesList.length - 1 && (
                            <span className='text-text-tertiary text-sm ml-1'>|</span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className='text-text-secondary text-sm'>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
