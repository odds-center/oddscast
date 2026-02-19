/**
 * 승식별 AI 예측 섹션
 * HORSE_RACING_TERMINOLOGY 기준 — 승식 | 선택/조합 | 표시 예 테이블 형태
 * 7개 승식(단승·복승·연승·쌍승·복연승·삼복승·삼쌍승) 항상 표시
 * 표시 예: 마번만 (6, 5→6→1 등), 아이콘으로 구분
 */
import { ArrowRight, Circle } from 'lucide-react';
import { PICK_TYPE_POOL_NAMES, PICK_TYPE_COMBO_DESC } from '@/lib/api/picksApi';
import type { BetTypePredictions, PredictionHorseScore } from '@/lib/types/predictions';

const BET_TYPE_ORDER: (keyof BetTypePredictions)[] = [
  'SINGLE',
  'PLACE',
  'QUINELLA',
  'EXACTA',
  'QUINELLA_PLACE',
  'TRIFECTA',
  'TRIPLE',
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
  /** true: 단승식만 표시 (무료 요약용, 예측권 유인) */
  showOnlySingle?: boolean;
}

/** 출주번호(마번)만 반환 — chulNo 우선, 없으면 hrNo(2자 이내) */
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

/** horseScores + entries에서 승식별 기본 조합 유도 (2마리/3마리 승식은 3개 조합) */
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
      ...entries
        .slice(ids.length, 6)
        .map((e) => e.hrNo ?? e.chulNo ?? '')
        .filter(Boolean),
    ];
  }
  const [a, b, c, d] = ids;
  if (!a) return {};

  const pairCombos =
    b && c
      ? [
          { hrNos: [a, b] as [string, string] },
          { hrNos: [a, c] as [string, string] },
          { hrNos: [b, c] as [string, string] },
        ]
      : b
        ? [{ hrNos: [a, b] as [string, string] }]
        : [];
  const exactaCombos =
    b && c
      ? [
          { first: a, second: b },
          { first: a, second: c },
          { first: b, second: a },
        ]
      : b
        ? [{ first: a, second: b }]
        : [];
  const tripleCombos =
    a && b && c && d
      ? [
          { hrNos: [a, b, c] as [string, string, string] },
          { hrNos: [a, b, d] as [string, string, string] },
          { hrNos: [a, c, d] as [string, string, string] },
        ]
      : a && b && c
        ? [{ hrNos: [a, b, c] as [string, string, string] }]
        : [];
  const tripleExactCombos =
    a && b && c && d
      ? [
          { first: a, second: b, third: c },
          { first: a, second: b, third: d },
          { first: a, second: c, third: b },
        ]
      : a && b && c
        ? [{ first: a, second: b, third: c }]
        : [];

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

/** 단일 조합을 표시용 노드로 변환 (SINGLE/Pair/Exacta/Triple/TripleExact) */
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

/** 예측을 표시용 노드 배열로 변환 (combinations 있으면 최대 3개, 없으면 단일) */
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

export default function BetTypePredictionsSection({
  betTypePredictions,
  horseScores,
  entries,
  showOnlySingle = false,
}: BetTypePredictionsSectionProps) {
  const derived =
    horseScores?.length || entries.length
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

  const orderToShow: (keyof BetTypePredictions)[] = showOnlySingle
    ? ['SINGLE']
    : BET_TYPE_ORDER;
  const items = orderToShow.map((key) => {
    const pred = merged[key];
    const nodesList = pred ? predToDisplayNodesList(pred, entries) : [];
    return {
      key,
      label: PICK_TYPE_POOL_NAMES[key] ?? key,
      comboDesc: PICK_TYPE_COMBO_DESC[key] ?? '',
      nodesList,
    };
  });

  return (
    <div className='py-3'>
      <p className='text-text-secondary text-xs font-medium mb-2'>승식별 AI 추천</p>
      <div className='data-table-wrapper -mx-2 sm:mx-0 overflow-x-auto rounded-lg border border-border'>
        <table className='data-table data-table-compact w-full min-w-[320px]'>
          <thead>
            <tr>
              <th className='w-20 text-left py-2.5'>승식</th>
              <th className='min-w-[120px] text-left py-2.5'>선택/조합</th>
              <th className='text-left py-2.5'>추천</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.key} className='border-t border-border'>
                <td className='py-2 font-medium text-foreground'>{item.label}</td>
                <td className='py-2 text-text-secondary text-sm'>{item.comboDesc}</td>
                <td className='py-2'>
                  {item.nodesList.length > 0 ? (
                    <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                      {item.nodesList.map((nodes, comboIdx) => (
                        <span key={comboIdx} className='inline-flex items-center gap-1'>
                          {nodes.numbers.map((num, i) => (
                            <span key={i} className='flex items-center gap-0.5'>
                              <span className='inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-md bg-slate-100 text-slate-700 font-bold text-sm'>
                                {num}
                              </span>
                              {i < nodes.numbers.length - 1 &&
                                (nodes.ordered ? (
                                  <ArrowRight size={14} className='text-text-tertiary shrink-0' strokeWidth={2.5} />
                                ) : (
                                  <Circle size={6} className='text-text-tertiary fill-text-tertiary shrink-0' />
                                ))}
                            </span>
                          ))}
                          {comboIdx < item.nodesList.length - 1 && (
                            <span className='text-text-tertiary text-xs'>|</span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className='text-text-secondary'>—</span>
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
