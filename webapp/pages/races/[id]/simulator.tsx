/**
 * Custom Prediction Simulator (FEATURE_ROADMAP 3.2)
 * Uses real Python sub-scores (rat/frm/cnd/exp/trn/suit) to re-rank horses by user-adjusted weights.
 * Falls back to synthetic factor distribution when sub-scores are unavailable.
 */
import { useRouter } from 'next/router';
import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import DataFetchState from '@/components/page/DataFetchState';
import Icon from '@/components/icons';
import { Button } from '@/components/ui/button';
import RaceApi from '@/lib/api/raceApi';
import PredictionApi from '@/lib/api/predictionApi';
import { routes } from '@/lib/routes';
import type { PredictionHorseScore } from '@/lib/types/predictions';

// Sub-score keys match Python analysis output (prediction-internal.types.ts HorseAnalysisItem.sub)
const FACTORS: { key: keyof NonNullable<PredictionHorseScore['sub']>; label: string; desc: string }[] = [
  { key: 'rat', label: '레이팅',   desc: '공식 레이팅 점수 기반' },
  { key: 'frm', label: '폼',       desc: '최근 경주 착순 기반' },
  { key: 'cnd', label: '컨디션',   desc: '훈련 강도·상태' },
  { key: 'exp', label: '경험',     desc: '출전 횟수·경험치' },
  { key: 'trn', label: '훈련',     desc: '조교 기록 기반' },
  { key: 'suit', label: '거리적성', desc: '거리·경마장 적합도' },
];

const SLIDER_MIN = 0;
const SLIDER_MAX = 2;
const SLIDER_DEFAULT = 1;

/**
 * Extract real sub-scores from a horse. If unavailable, distribute total score synthetically
 * so weights still have a meaningful effect. Returns array aligned with FACTORS order.
 */
function getFactorValues(h: PredictionHorseScore): number[] {
  const sub = h.sub;
  if (sub && Object.values(sub).some((v) => v != null && v > 0)) {
    return FACTORS.map(({ key }) => sub[key] ?? 0);
  }
  // Fallback: distribute total score into 6 parts with minor variation per horse
  const s = Math.max(1, h.score ?? 50);
  const base = s / FACTORS.length;
  const hrSeed = [...(h.hrNo ?? h.hrName ?? '?')].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FACTORS.map((_, j) => {
    const v = base * (1 + 0.12 * Math.sin(hrSeed * 0.37 + j * 1.9));
    return Math.max(0.5, v);
  });
}

type RankedHorse = {
  horse: PredictionHorseScore;
  aiRank: number;
  customScore: number;
  aiScore: number;
  factors: number[];
};

export default function SimulatorPage() {
  const router = useRouter();
  const id = router.query?.id as string | undefined;
  const [weights, setWeights] = useState<number[]>(() => FACTORS.map(() => SLIDER_DEFAULT));
  const [copied, setCopied] = useState(false);

  const { data: race, isLoading: raceLoading, isError: raceError, refetch: refetchRace } = useQuery({
    queryKey: ['race', id],
    queryFn: () => RaceApi.getRace(id!),
    enabled: !!id,
  });

  const { data: preview, isLoading: previewLoading, isError: previewError, refetch: refetchPreview } = useQuery({
    queryKey: ['prediction', 'preview', id],
    queryFn: () => PredictionApi.getPreview(id!),
    enabled: !!id,
  });

  const horseScores = useMemo(() => preview?.scores?.horseScores ?? [], [preview?.scores?.horseScores]);
  const hasScores = horseScores.length > 0;
  const hasRealSub = useMemo(
    () => horseScores.some((h) => h.sub && Object.values(h.sub).some((v) => v != null && v > 0)),
    [horseScores],
  );

  // AI ranking (by score desc) — fixed reference for rank-change calculation
  const aiRanked = useMemo(
    () => [...horseScores].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [horseScores],
  );

  // Per-horse factor values (real sub-scores or synthetic fallback)
  const factorsByHorse = useMemo(
    () => aiRanked.map((h) => getFactorValues(h)),
    [aiRanked],
  );

  // Re-rank by weighted sum of factor values
  const customRanked = useMemo((): RankedHorse[] => {
    if (aiRanked.length === 0) return [];
    return aiRanked
      .map((horse, i) => {
        const factors = factorsByHorse[i] ?? [];
        const customScore = factors.reduce((acc, f, j) => acc + (weights[j] ?? SLIDER_DEFAULT) * f, 0);
        return { horse, aiRank: i + 1, customScore, aiScore: horse.score ?? 0, factors };
      })
      .sort((a, b) => b.customScore - a.customScore);
  }, [aiRanked, factorsByHorse, weights]);

  const maxCustomScore = useMemo(
    () => Math.max(1, ...customRanked.map((r) => r.customScore)),
    [customRanked],
  );

  const resetWeights = useCallback(() => setWeights(FACTORS.map(() => SLIDER_DEFAULT)), []);

  const handleShare = useCallback(() => {
    const top3 = customRanked
      .slice(0, 3)
      .map((r, i) => `${i + 1}위 ${r.horse.chulNo ? `(${r.horse.chulNo}번)` : ''}${r.horse.hrName ?? r.horse.hrNo ?? '-'}`)
      .join(' / ');
    const rcNo = (race as { rcNo?: string } | undefined)?.rcNo ?? id ?? '';
    const meetName = (race as { meetName?: string } | undefined)?.meetName ?? '';
    const text = `[OddsCast 시뮬레이터] ${meetName} 제${rcNo}경주 내 예측 → ${top3}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
        .catch(() => {});
    }
  }, [customRanked, race, id]);

  const isLoading = raceLoading || previewLoading;
  const isError = raceError || previewError;
  const refetch = useCallback(() => { refetchRace(); refetchPreview(); }, [refetchRace, refetchPreview]);

  const rcNo = (race as { rcNo?: string } | undefined)?.rcNo ?? '';
  const meetName = (race as { meetName?: string } | undefined)?.meetName ?? '';
  const backHref = id ? routes.races.detail(id) : routes.races.list;
  const pageTitle = rcNo ? `시뮬레이터 — ${meetName} 제${rcNo}경주` : '시뮬레이터';

  return (
    <Layout title={rcNo ? `시뮬레이터 | 경주 #${rcNo} | OddsCast` : '시뮬레이터 | OddsCast'} description='나만의 경주 시뮬레이션으로 출전마를 분석하고 예측해 보세요.'>
      <CompactPageTitle title={pageTitle} backHref={backHref} />

      <DataFetchState
        isLoading={isLoading}
        error={isError ? new Error('경주 또는 예측 정보를 불러올 수 없습니다') : null}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && !id}
        emptyIcon="Target"
        emptyTitle="경주를 선택해 주세요"
        emptyAction={
          <Button asChild>
            <Link href={routes.races.list}>
              <Icon name="ClipboardList" size={18} />
              경주 목록
            </Link>
          </Button>
        }
        loadingLabel="예측 데이터 불러오는 중..."
      >
        {!hasScores && !isLoading ? (
          <div className="rounded-xl border border-border bg-stone-50 px-4 py-10 text-center">
            <Icon name="AlertCircle" size={32} className="text-text-tertiary mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">예측 데이터가 없습니다</p>
            <p className="text-sm text-text-secondary mb-5">
              이 경주의 AI 예측이 준비되면 시뮬레이터를 이용할 수 있습니다.
            </p>
            <Button asChild>
              <Link href={backHref}>
                <Icon name="ChevronLeft" size={18} />
                경주 상세로
              </Link>
            </Button>
          </div>
        ) : hasScores ? (
          <div className="space-y-5">
            {/* Info bar */}
            <div className="flex items-center gap-2 rounded-lg bg-primary/8 border border-primary/20 px-3 py-2">
              <Icon name="AlertCircle" size={15} className="text-primary shrink-0" />
              <p className="text-xs text-primary">
                {hasRealSub
                  ? 'AI가 계산한 실제 세부 점수(레이팅·폼·컨디션·경험·훈련·거리적성)를 가중치로 조절합니다.'
                  : '이 예측은 세부 점수 없이 종합 점수만 제공됩니다. 가중치 조절 시 추정 비중을 반영합니다.'}
              </p>
            </div>

            {/* Weight sliders */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-stone-50/80 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">가중치 조절</span>
                <button
                  type="button"
                  onClick={resetWeights}
                  className="text-xs text-text-secondary hover:text-foreground flex items-center gap-1 touch-manipulation"
                >
                  <Icon name="RefreshCw" size={13} />
                  초기화
                </button>
              </div>
              <div className="p-4 space-y-4">
                {FACTORS.map(({ key, label, desc }, j) => {
                  const w = weights[j] ?? SLIDER_DEFAULT;
                  const isHigh = w > 1.3;
                  const isLow = w < 0.7;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className="text-sm font-medium text-foreground">{label}</span>
                          <span className="ml-1.5 text-xs text-text-tertiary">{desc}</span>
                        </div>
                        <span className={`text-sm font-semibold tabular-nums w-10 text-right ${isHigh ? 'text-primary' : isLow ? 'text-text-tertiary' : 'text-foreground'}`}>
                          ×{w.toFixed(1)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={SLIDER_MIN}
                        max={SLIDER_MAX}
                        step={0.1}
                        value={w}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setWeights((prev) => { const next = [...prev]; next[j] = v; return next; });
                        }}
                        className="w-full h-2 rounded-full appearance-none bg-stone-200 accent-primary"
                        aria-label={`${label} 가중치`}
                      />
                      <div className="flex justify-between text-[11px] text-text-tertiary mt-0.5">
                        <span>무시</span>
                        <span>기본</span>
                        <span>강조</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Re-ranked results */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-stone-50/80 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">재순위 결과</span>
                <button
                  type="button"
                  onClick={handleShare}
                  className="text-xs text-text-secondary hover:text-foreground flex items-center gap-1 touch-manipulation"
                >
                  <Icon name={copied ? 'Check' : 'Copy'} size={13} />
                  {copied ? '복사됨' : '결과 복사'}
                </button>
              </div>
              <div className="divide-y divide-border">
                {customRanked.map(({ horse, aiRank, customScore, aiScore }, i) => {
                  const rank = i + 1;
                  const rankDiff = aiRank - rank; // positive = moved up
                  const horseName = horse.hrName ?? horse.horseName ?? horse.hrNo ?? '-';
                  const isTop3 = rank <= 3;
                  const barPct = Math.round((customScore / maxCustomScore) * 100);
                  const aiBarPct = Math.round((aiScore / (Math.max(1, ...customRanked.map(r => r.aiScore)))) * 100);

                  return (
                    <div key={horse.hrNo ?? i} className={`px-4 py-3 ${isTop3 ? 'bg-primary/3' : ''}`}>
                      <div className="flex items-center gap-3">
                        {/* Rank badge */}
                        <div className="shrink-0 flex flex-col items-center gap-0.5 w-8">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                            rank === 1 ? 'bg-amber-400 text-white' :
                            rank === 2 ? 'bg-stone-400 text-white' :
                            rank === 3 ? 'bg-amber-700 text-white' :
                            'bg-stone-100 text-text-tertiary'
                          }`}>
                            {rank}
                          </span>
                          {rankDiff !== 0 && (
                            <span className={`text-[11px] font-semibold leading-none ${rankDiff > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                              {rankDiff > 0 ? `▲${rankDiff}` : `▼${Math.abs(rankDiff)}`}
                            </span>
                          )}
                          {rankDiff === 0 && (
                            <span className="text-[11px] text-text-tertiary leading-none">—</span>
                          )}
                        </div>

                        {/* Horse info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {horse.chulNo != null && horse.chulNo !== '' && (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-700 text-white text-[11px] font-bold shrink-0">
                                {horse.chulNo}
                              </span>
                            )}
                            <Link
                              href={horse.hrNo ? routes.horses.detail(horse.hrNo) : '#'}
                              className="font-semibold text-foreground text-sm hover:text-primary"
                            >
                              {horseName}
                            </Link>
                            {horse.winProb != null && (
                              <span className="text-xs text-text-tertiary">
                                승률 {horse.winProb.toFixed(1)}%
                              </span>
                            )}
                          </div>
                          {/* Score bars */}
                          <div className="mt-1.5 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-text-tertiary w-12 shrink-0">커스텀</span>
                              <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all duration-300"
                                  style={{ width: `${barPct}%` }}
                                />
                              </div>
                              <span className="text-xs tabular-nums text-foreground font-medium w-9 text-right">{customScore.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-text-tertiary w-12 shrink-0">AI</span>
                              <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-stone-300 transition-all duration-300"
                                  style={{ width: `${aiBarPct}%` }}
                                />
                              </div>
                              <span className="text-xs tabular-nums text-text-tertiary w-9 text-right">{aiScore.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sub-score breakdown table (only when real sub data available) */}
            {hasRealSub && (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-stone-50/80">
                  <span className="text-sm font-semibold text-foreground">말별 세부 점수</span>
                  <span className="ml-2 text-xs text-text-tertiary">가중치 적용 전 원점수 (0–100)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table data-table-compact w-full">
                    <thead>
                      <tr>
                        <th className="text-left">마명</th>
                        {FACTORS.map((f) => (
                          <th key={f.key} className="cell-center w-14">{f.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {aiRanked.map((h, i) => {
                        const fs = factorsByHorse[i] ?? [];
                        return (
                          <tr key={h.hrNo ?? i}>
                            <td className="font-medium">
                              <span className="flex items-center gap-1.5">
                                {h.chulNo != null && h.chulNo !== '' && (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-700 text-white text-[10px] font-bold shrink-0">
                                    {h.chulNo}
                                  </span>
                                )}
                                {h.hrName ?? h.hrNo ?? '-'}
                              </span>
                            </td>
                            {fs.map((v, j) => (
                              <td key={j} className="cell-center tabular-nums text-text-secondary">
                                {v.toFixed(1)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DataFetchState>
    </Layout>
  );
}
