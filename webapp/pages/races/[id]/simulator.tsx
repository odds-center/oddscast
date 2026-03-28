/**
 * Custom Prediction Simulator — compact single-screen layout
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

const FACTORS: { key: keyof NonNullable<PredictionHorseScore['sub']>; label: string; short: string }[] = [
  { key: 'rat', label: '레이팅', short: '레이팅' },
  { key: 'frm', label: '폼',     short: '폼' },
  { key: 'cnd', label: '컨디션', short: '컨디션' },
  { key: 'exp', label: '경험',   short: '경험' },
  { key: 'trn', label: '훈련',   short: '훈련' },
  { key: 'suit', label: '거리적성', short: '거리' },
];

const SLIDER_MIN = 0;
const SLIDER_MAX = 2;
const SLIDER_DEFAULT = 1;

function getFactorValues(h: PredictionHorseScore): number[] {
  const sub = h.sub;
  if (sub && Object.values(sub).some((v) => v != null && v > 0)) {
    return FACTORS.map(({ key }) => sub[key] ?? 0);
  }
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

  const aiRanked = useMemo(
    () => [...horseScores].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [horseScores],
  );

  const factorsByHorse = useMemo(
    () => aiRanked.map((h) => getFactorValues(h)),
    [aiRanked],
  );

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
  const pageTitle = rcNo ? `시뮬레이터 — ${meetName} ${rcNo}R` : '시뮬레이터';

  const isDefault = weights.every((w) => w === SLIDER_DEFAULT);

  return (
    <Layout title={rcNo ? `시뮬레이터 | ${rcNo}R | OddsCast` : '시뮬레이터 | OddsCast'} description='나만의 경주 시뮬레이션으로 출전마를 분석하고 예측해 보세요.'>
      <CompactPageTitle title={pageTitle} backHref={backHref} />

      <DataFetchState
        isLoading={isLoading}
        error={isError ? new Error('경주 또는 예측 정보를 불러올 수 없습니다') : null}
        onRetry={() => refetch()}
        isEmpty={!isLoading && !isError && !id}
        emptyIcon='Target'
        emptyTitle='경주를 선택해 주세요'
        emptyAction={
          <Button asChild>
            <Link href={routes.races.list}>
              <Icon name='ClipboardList' size={18} />
              경주 목록
            </Link>
          </Button>
        }
        loadingLabel='예측 데이터 불러오는 중...'
      >
        {!hasScores && !isLoading ? (
          <div className='rounded-xl border border-border bg-stone-50 px-4 py-10 text-center'>
            <Icon name='AlertCircle' size={32} className='text-text-tertiary mx-auto mb-3' />
            <p className='text-foreground font-medium mb-1'>예측 데이터가 없습니다</p>
            <p className='text-sm text-text-secondary mb-5'>
              이 경주의 AI 예측이 준비되면 시뮬레이터를 이용할 수 있습니다.
            </p>
            <Button asChild>
              <Link href={backHref}>
                <Icon name='ChevronLeft' size={18} />
                경주 상세로
              </Link>
            </Button>
          </div>
        ) : hasScores ? (
          <div className='space-y-3'>
            {/* ── Compact weight sliders: 3-column grid ── */}
            <div className='rounded-xl border border-border overflow-hidden shadow-sm'>
              <div className='px-3 py-2 border-b border-border bg-stone-50/80 flex items-center justify-between'>
                <div className='flex items-center gap-1.5'>
                  <Icon name='Settings' size={14} className='text-primary' />
                  <span className='text-xs font-semibold text-foreground'>가중치 조절</span>
                </div>
                {!isDefault && (
                  <button
                    type='button'
                    onClick={resetWeights}
                    className='text-[11px] text-text-tertiary hover:text-foreground flex items-center gap-1'
                  >
                    <Icon name='RefreshCw' size={11} />
                    초기화
                  </button>
                )}
              </div>
              <div className='p-3 grid grid-cols-3 gap-x-3 gap-y-2.5'>
                {FACTORS.map(({ key, short }, j) => {
                  const w = weights[j] ?? SLIDER_DEFAULT;
                  const isHigh = w > 1.3;
                  const isLow = w < 0.7;
                  return (
                    <div key={key}>
                      <div className='flex items-center justify-between mb-0.5'>
                        <span className='text-[11px] font-medium text-text-secondary'>{short}</span>
                        <span className={`text-[11px] font-bold tabular-nums ${isHigh ? 'text-primary' : isLow ? 'text-stone-400' : 'text-text-secondary'}`}>
                          ×{w.toFixed(1)}
                        </span>
                      </div>
                      <input
                        type='range'
                        min={SLIDER_MIN}
                        max={SLIDER_MAX}
                        step={0.1}
                        value={w}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setWeights((prev) => { const next = [...prev]; next[j] = v; return next; });
                        }}
                        className='w-full h-5 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-stone-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:-mt-[5px] [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-stone-200 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow'
                        aria-label={`${short} 가중치`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Re-ranked results — compact rows ── */}
            <div className='rounded-xl border border-border overflow-hidden shadow-sm'>
              <div className='px-3 py-2 border-b border-border bg-stone-50/80 flex items-center justify-between'>
                <div className='flex items-center gap-1.5'>
                  <Icon name='Trophy' size={14} className='text-amber-500' />
                  <span className='text-xs font-semibold text-foreground'>재순위 결과</span>
                  {!isDefault && <span className='text-[10px] text-primary font-medium'>(가중치 적용)</span>}
                </div>
                <button
                  type='button'
                  onClick={handleShare}
                  className='text-[11px] text-text-tertiary hover:text-foreground flex items-center gap-1'
                >
                  <Icon name={copied ? 'Check' : 'Copy'} size={11} />
                  {copied ? '복사됨' : '복사'}
                </button>
              </div>
              <div className='divide-y divide-border/50'>
                {customRanked.map(({ horse, aiRank, customScore, aiScore }, i) => {
                  const rank = i + 1;
                  const rankDiff = aiRank - rank;
                  const horseName = horse.hrName ?? horse.horseName ?? horse.hrNo ?? '-';
                  const isTop3 = rank <= 3;
                  const barPct = Math.round((customScore / maxCustomScore) * 100);

                  return (
                    <div key={horse.hrNo ?? i} className={`flex items-center gap-2 px-3 py-2 ${isTop3 ? 'bg-primary/[0.02]' : ''}`}>
                      {/* Rank */}
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        rank === 1 ? 'bg-amber-400 text-amber-950' :
                        rank === 2 ? 'bg-stone-300 text-stone-800' :
                        rank === 3 ? 'bg-amber-700/80 text-amber-50' :
                        'bg-stone-100 text-stone-500'
                      }`}>
                        {rank}
                      </span>

                      {/* Rank change */}
                      <span className={`w-6 text-center text-[10px] font-bold shrink-0 ${
                        rankDiff > 0 ? 'text-emerald-600' : rankDiff < 0 ? 'text-red-500' : 'text-text-tertiary'
                      }`}>
                        {rankDiff > 0 ? `▲${rankDiff}` : rankDiff < 0 ? `▼${Math.abs(rankDiff)}` : '—'}
                      </span>

                      {/* Horse name */}
                      <div className='w-[68px] shrink-0 truncate'>
                        <Link
                          href={horse.hrNo ? routes.horses.detail(horse.hrNo) : '#'}
                          className='text-sm font-medium text-foreground hover:text-primary truncate'
                        >
                          {horse.chulNo && <span className='text-text-tertiary text-[10px] mr-0.5'>{horse.chulNo}</span>}
                          {horseName}
                        </Link>
                      </div>

                      {/* Score bar */}
                      <div className='flex-1 min-w-0'>
                        <div className='h-5 rounded bg-stone-100/80 overflow-hidden relative'>
                          <div
                            className={`h-full rounded bg-gradient-to-r ${isTop3 ? 'from-primary/80 to-emerald-400/80' : 'from-stone-400/60 to-stone-300/60'} transition-all duration-300`}
                            style={{ width: `${barPct}%` }}
                          />
                          {/* AI score marker line */}
                          <div
                            className='absolute top-0 h-full w-px bg-stone-500/40'
                            style={{ left: `${Math.round((aiScore / maxCustomScore) * 100)}%` }}
                            title={`AI: ${aiScore.toFixed(1)}`}
                          />
                        </div>
                      </div>

                      {/* Score value */}
                      <span className={`w-10 text-right text-xs tabular-nums shrink-0 ${isTop3 ? 'font-bold text-foreground' : 'font-semibold text-text-secondary'}`}>
                        {customScore.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className='px-3 py-1.5 bg-stone-50/50 border-t border-border/30 flex items-center gap-3 text-[10px] text-text-tertiary'>
                <span className='flex items-center gap-1'>
                  <span className='w-3 h-3 rounded bg-gradient-to-r from-primary/80 to-emerald-400/80' />
                  커스텀 점수
                </span>
                <span className='flex items-center gap-1'>
                  <span className='w-px h-3 bg-stone-500/40' />
                  AI 원점수
                </span>
                <span>▲▼ AI 순위 대비 변동</span>
              </div>
            </div>
          </div>
        ) : null}
      </DataFetchState>
    </Layout>
  );
}
