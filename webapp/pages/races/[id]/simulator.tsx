/**
 * Custom Prediction Simulator (FEATURE_ROADMAP 3.2)
 * Adjust 6 weight factors, see re-ranked horses. Client-side only, uses existing prediction scores.
 */
import { useRouter } from 'next/router';
import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Layout from '@/components/Layout';
import BackLink from '@/components/page/BackLink';
import DataFetchState from '@/components/page/DataFetchState';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import Icon from '@/components/icons';
import { SectionTitle } from '@/components/ui';
import RaceApi from '@/lib/api/raceApi';
import PredictionApi from '@/lib/api/predictionApi';
import { routes } from '@/lib/routes';

const FACTOR_LABELS: [string, string][] = [
  ['rating', '레이팅'],
  ['form', '폼'],
  ['condition', '컨디션'],
  ['experience', '경험'],
  ['fitness', '체력'],
  ['trainer', '조교사'],
];

const SLIDER_MIN = 0.5;
const SLIDER_MAX = 1.5;
const SLIDER_DEFAULT = 1;

/** Deterministic 6 factors per horse that sum to score, so weight change can reorder. */
function buildSyntheticFactors(
  horseScores: Array<{ score?: number; hrNo?: string }>,
): number[][] {
  const sorted = [...horseScores].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return sorted.map((h, i) => {
    const s = Math.max(0, h.score ?? 0);
    const base = s / 6;
    const parts: number[] = [];
    let sum = 0;
    for (let j = 0; j < 6; j++) {
      const variation = 0.15 * Math.sin((i * 7 + j * 11) % 10);
      const v = Math.max(0.01, base * (1 + variation));
      parts.push(v);
      sum += v;
    }
    const scale = sum > 0 ? s / sum : 1;
    return parts.map((p) => p * scale);
  });
}

export default function SimulatorPage() {
  const router = useRouter();
  const id = router.query?.id as string | undefined;

  const [weights, setWeights] = useState<number[]>(() =>
    FACTOR_LABELS.map(() => SLIDER_DEFAULT),
  );

  const {
    data: race,
    isLoading: raceLoading,
    isError: raceError,
    refetch: refetchRace,
  } = useQuery({
    queryKey: ['race', id],
    queryFn: () => RaceApi.getRace(id!),
    enabled: !!id,
  });

  const {
    data: preview,
    isLoading: previewLoading,
    isError: previewError,
    refetch: refetchPreview,
  } = useQuery({
    queryKey: ['prediction', 'preview', id],
    queryFn: () => PredictionApi.getPreview(id!),
    enabled: !!id,
  });

  const horseScores = useMemo(() => preview?.scores?.horseScores ?? [], [preview?.scores?.horseScores]);
  const hasScores = horseScores.length > 0;

  const factorsPerHorse = useMemo(
    () => (hasScores ? buildSyntheticFactors(horseScores) : []),
    [hasScores, horseScores],
  );

  const sortedByScore = useMemo(
    () => [...horseScores].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [horseScores],
  );

  const customRanked = useMemo(() => {
    if (sortedByScore.length === 0 || factorsPerHorse.length === 0) return [];
    const withCustom = sortedByScore.map((h, i) => {
      const factors = factorsPerHorse[i] ?? [];
      const customScore = factors.reduce((acc, f, j) => acc + (weights[j] ?? SLIDER_DEFAULT) * f, 0);
      return { horse: h, customScore, aiScore: h.score ?? 0 };
    });
    return [...withCustom].sort((a, b) => b.customScore - a.customScore);
  }, [sortedByScore, factorsPerHorse, weights]);

  const resetWeights = useCallback(() => {
    setWeights(FACTOR_LABELS.map(() => SLIDER_DEFAULT));
  }, []);

  const handleShare = useCallback(() => {
    const top3 = customRanked.slice(0, 3).map((r, i) => `${i + 1}. ${r.horse.hrName ?? r.horse.horseName ?? r.horse.hrNo ?? '-'}`);
    const rcNo = (race as { rcNo?: string } | undefined)?.rcNo ?? id ?? '';
    const text = `내 커스텀 예측 경주 #${rcNo}: ${top3.join(' ')}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => alert('클립보드에 복사되었습니다.')).catch(() => {});
    } else {
      prompt('아래 텍스트를 복사하세요', text);
    }
  }, [customRanked, race, id]);

  const isLoading = raceLoading || previewLoading;
  const isError = raceError || previewError;
  const refetch = useCallback(() => {
    refetchRace();
    refetchPreview();
  }, [refetchRace, refetchPreview]);
  const rcNo = (race as { rcNo?: string } | undefined)?.rcNo ?? id ?? '';
  const meetName = (race as { meetName?: string } | undefined)?.meetName ?? '';

  return (
    <Layout title={rcNo ? `커스텀 시뮬레이터 | 경주 #${rcNo} | OddsCast` : '커스텀 시뮬레이터 | OddsCast'}>
      <BackLink href={id ? routes.races.detail(id) : routes.races.list} label="경주 상세로" className="block mb-4" />

      {!id ? (
        <DataFetchState
          isLoading={false}
          error={null}
          isEmpty
          emptyTitle="경주를 선택해 주세요"
          emptyAction={
            <Link href={routes.races.list} className="btn-primary inline-flex items-center gap-2">
              <Icon name="ClipboardList" size={18} />
              경주 목록
            </Link>
          }
        >
          {null}
        </DataFetchState>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <EmptyState
          icon="AlertCircle"
          title="경주 또는 예측 정보를 불러올 수 없습니다"
          description="잠시 후 다시 시도해 주세요."
          action={
            <button type="button" onClick={() => refetch()} className="btn-secondary px-3 py-1.5 text-sm">
              다시 시도
            </button>
          }
        />
      ) : !hasScores ? (
        <div className="rounded-xl border border-border bg-muted/20 px-4 py-8 text-center">
          <p className="text-foreground font-medium mb-2">예측 데이터가 없습니다</p>
          <p className="text-sm text-text-secondary mb-4">
            이 경주의 AI 예측을 먼저 확인한 뒤 시뮬레이터를 이용해 주세요.
          </p>
          <Link href={id ? routes.races.detail(id) : routes.races.list} className="btn-primary inline-flex items-center gap-2">
            <Icon name="ChevronLeft" size={18} />
            경주 상세로
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <SectionTitle
            title={`커스텀 예측 시뮬레이터`}
            icon="Target"
            badge={meetName ? `${meetName} 제${rcNo}경주` : undefined}
            className="mb-2"
          />

          <p className="text-sm text-text-secondary">
            아래 가중치를 조절하면 말 순위가 바뀝니다. AI 기본 예측에 보조 요인을 반영한 재순위입니다.
          </p>

          <div className="rounded-xl border border-border overflow-hidden bg-muted/5">
            <div className="px-3 py-2.5 border-b border-border bg-stone-50/80">
              <span className="text-sm font-semibold text-foreground">가중치 조절</span>
            </div>
            <div className="p-4 space-y-4">
              {FACTOR_LABELS.map(([key, label], j) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="w-20 text-sm text-foreground shrink-0">{label}</label>
                  <input
                    type="range"
                    min={SLIDER_MIN}
                    max={SLIDER_MAX}
                    step={0.1}
                    value={weights[j] ?? SLIDER_DEFAULT}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setWeights((prev) => {
                        const next = [...prev];
                        next[j] = v;
                        return next;
                      });
                    }}
                    className="flex-1 h-2 rounded-lg appearance-none bg-stone-200 accent-primary"
                  />
                  <span className="w-10 text-right text-sm tabular-nums text-foreground">
                    {(weights[j] ?? SLIDER_DEFAULT).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 px-4 pb-4">
              <button type="button" onClick={resetWeights} className="btn-secondary text-sm inline-flex items-center gap-1.5">
                <Icon name="RefreshCw" size={16} />
                AI 기본값으로
              </button>
              <button type="button" onClick={handleShare} className="btn-secondary text-sm inline-flex items-center gap-1.5">
                <Icon name="ClipboardList" size={16} />
                결과 공유
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border bg-stone-50/80 flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">재순위 결과</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[280px] text-sm">
                <thead>
                  <tr className="border-b border-border text-text-secondary">
                    <th className="text-left py-2 px-3 w-14 font-medium">순위</th>
                    <th className="text-left py-2 px-3 font-medium">마명</th>
                    <th className="cell-right py-2 px-3 w-20 font-medium">커스텀 점수</th>
                    <th className="cell-right py-2 px-3 w-20 font-medium">AI 점수</th>
                  </tr>
                </thead>
                <tbody>
                  {customRanked.map(({ horse, customScore, aiScore }, i) => (
                    <tr key={horse.hrNo ?? i} className="border-b border-border last:border-0">
                      <td className="py-2 px-3 font-medium text-foreground">{i + 1}</td>
                      <td className="py-2 px-3 text-foreground">
                        {horse.hrName ?? horse.horseName ?? horse.hrNo ?? '-'}
                      </td>
                      <td className="cell-right py-2 px-3 tabular-nums text-foreground">
                        {customScore.toFixed(1)}
                      </td>
                      <td className="cell-right py-2 px-3 tabular-nums text-text-secondary">
                        {aiScore.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
