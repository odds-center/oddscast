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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
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
            <div className="rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border bg-stone-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="Settings" size={15} className="text-primary" />
                  <span className="text-sm font-semibold text-foreground">가중치 조절</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetWeights}
                  className="text-xs text-text-secondary hover:text-foreground px-2"
                >
                  <Icon name="RefreshCw" size={13} />
                  초기화
                </Button>
              </div>
              <div className="p-4 space-y-5">
                {FACTORS.map(({ key, label, desc }, j) => {
                  const w = weights[j] ?? SLIDER_DEFAULT;
                  const isHigh = w > 1.3;
                  const isLow = w < 0.7;
                  const pctFromCenter = ((w - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
                  return (
                    <div key={key} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{label}</span>
                          <span className="text-[11px] text-text-tertiary">{desc}</span>
                        </div>
                        <span className={`text-sm font-bold tabular-nums px-2 py-0.5 rounded-md ${isHigh ? 'text-primary bg-primary/8' : isLow ? 'text-text-tertiary bg-stone-100' : 'text-foreground bg-stone-50'}`}>
                          ×{w.toFixed(1)}
                        </span>
                      </div>
                      <div className="relative">
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full overflow-hidden pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-r from-stone-200 via-stone-200 to-stone-200" />
                          <div
                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-150 ${isHigh ? 'bg-primary/40' : isLow ? 'bg-stone-300' : 'bg-primary/25'}`}
                            style={{ width: `${pctFromCenter}%` }}
                          />
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
                          className="relative w-full h-6 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
                          aria-label={`${label} 가중치`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-text-tertiary mt-0.5 px-0.5">
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
            <div className="rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border bg-stone-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="Trophy" size={15} className="text-amber-500" />
                  <span className="text-sm font-semibold text-foreground">재순위 결과</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="text-xs text-text-secondary hover:text-foreground px-2"
                >
                  <Icon name={copied ? 'Check' : 'Copy'} size={13} />
                  {copied ? '복사됨' : '결과 복사'}
                </Button>
              </div>
              <div className="divide-y divide-border/60">
                {customRanked.map(({ horse, aiRank, customScore, aiScore }, i) => {
                  const rank = i + 1;
                  const rankDiff = aiRank - rank;
                  const horseName = horse.hrName ?? horse.horseName ?? horse.hrNo ?? '-';
                  const isTop3 = rank <= 3;
                  const barPct = Math.round((customScore / maxCustomScore) * 100);
                  const aiBarPct = Math.round((aiScore / (Math.max(1, ...customRanked.map(r => r.aiScore)))) * 100);

                  return (
                    <div key={horse.hrNo ?? i} className={`px-4 py-3.5 transition-colors ${isTop3 ? 'bg-primary/[0.03]' : 'bg-card'}`}>
                      <div className="flex items-start gap-3">
                        {/* Rank badge + change */}
                        <div className="shrink-0 flex flex-col items-center gap-1 w-9 pt-0.5">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-sm ${
                            rank === 1 ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300/40' :
                            rank === 2 ? 'bg-stone-300 text-stone-800 ring-2 ring-stone-200/40' :
                            rank === 3 ? 'bg-amber-700/80 text-amber-50 ring-2 ring-amber-600/30' :
                            'bg-stone-100 text-stone-500'
                          }`}>
                            {rank}
                          </span>
                          {rankDiff !== 0 ? (
                            <span className={`text-[11px] font-bold leading-none px-1 py-0.5 rounded ${rankDiff > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                              {rankDiff > 0 ? `▲${rankDiff}` : `▼${Math.abs(rankDiff)}`}
                            </span>
                          ) : (
                            <span className="text-[11px] text-text-tertiary leading-none">—</span>
                          )}
                        </div>

                        {/* Horse info + bars */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-2">
                            {horse.chulNo != null && horse.chulNo !== '' && (
                              <span className="inline-flex items-center justify-center w-5.5 h-5.5 rounded-full bg-stone-700 text-white text-[10px] font-bold shrink-0">
                                {horse.chulNo}
                              </span>
                            )}
                            <Link
                              href={horse.hrNo ? routes.horses.detail(horse.hrNo) : '#'}
                              className="font-semibold text-foreground text-sm hover:text-primary transition-colors"
                            >
                              {horseName}
                            </Link>
                            {horse.winProb != null && (
                              <span className="text-[11px] text-text-tertiary bg-stone-100 px-1.5 py-0.5 rounded">
                                승률 {horse.winProb.toFixed(1)}%
                              </span>
                            )}
                          </div>
                          {/* Score bars */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium text-primary w-12 shrink-0">커스텀</span>
                              <div className="flex-1 h-2.5 rounded-full bg-stone-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-300"
                                  style={{ width: `${barPct}%` }}
                                />
                              </div>
                              <span className="text-xs tabular-nums text-foreground font-bold w-10 text-right">{customScore.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-text-tertiary w-12 shrink-0">AI</span>
                              <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-stone-300 transition-all duration-300"
                                  style={{ width: `${aiBarPct}%` }}
                                />
                              </div>
                              <span className="text-xs tabular-nums text-text-tertiary w-10 text-right">{aiScore.toFixed(1)}</span>
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
                <Table className='[&_th]:py-1 [&_th]:px-2 [&_td]:py-1.5 [&_td]:px-2'>
                  <TableHeader>
                    <TableRow className='hover:bg-transparent'>
                      <TableHead className="text-left">마명</TableHead>
                      {FACTORS.map((f) => (
                        <TableHead key={f.key} className="text-center w-14">{f.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aiRanked.map((h, i) => {
                      const fs = factorsByHorse[i] ?? [];
                      return (
                        <TableRow key={h.hrNo ?? i}>
                          <TableCell className="font-medium">
                            <span className="flex items-center gap-1.5">
                              {h.chulNo != null && h.chulNo !== '' && (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-700 text-white text-[10px] font-bold shrink-0">
                                  {h.chulNo}
                                </span>
                              )}
                              {h.hrName ?? h.hrNo ?? '-'}
                            </span>
                          </TableCell>
                          {fs.map((v, j) => (
                            <TableCell key={j} className="text-center tabular-nums text-text-secondary">
                              {v.toFixed(1)}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ) : null}
      </DataFetchState>
    </Layout>
  );
}
