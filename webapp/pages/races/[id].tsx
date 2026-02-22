import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { GetServerSideProps } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { serverGet } from '@/lib/api/serverFetch';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import { Card } from '@/components/ui';
import BackLink from '@/components/page/BackLink';
import LoadingSpinner from '@/components/LoadingSpinner';
import RaceHeaderCard from '@/components/race/RaceHeaderCard';
import HorseEntryTable from '@/components/race/HorseEntryTable';
import PredictionSymbol, { scoreToSymbol } from '@/components/race/PredictionSymbol';
import RaceApi from '@/lib/api/raceApi';
import PicksApi, { PICK_TYPE_HORSE_COUNTS } from '@/lib/api/picksApi';
import HorsePickPanel from '@/components/HorsePickPanel';
import BetTypePredictionsSection from '@/components/predictions/BetTypePredictionsSection';
import { CONFIG } from '@/lib/config';
import PredictionApi from '@/lib/api/predictionApi';
import PredictionTicketApi from '@/lib/api/predictionTicketApi';
import AnalysisApi from '@/lib/api/analysisApi';
import { useAuthStore } from '@/lib/store/authStore';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import { trackCTA } from '@/lib/analytics';
import type { PredictionDetailDto } from '@/lib/types/predictions';
import { getErrorMessage } from '@/lib/utils/error';
import { formatTime, formatNumber } from '@/lib/utils/format';

/** Convert KRA diffUnit text (e.g. "1¼", "목", "머리") to decimal number string */
function formatDiffUnit(diff: string): string {
  if (!diff) return '';
  const trimmed = diff.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) return trimmed;

  const koreanGaps: Record<string, string> = { 코: '0.05', 머리: '0.2', 목: '0.3', 대: '10+' };
  if (koreanGaps[trimmed]) return koreanGaps[trimmed];

  const fractions: Record<string, number> = { '¼': 0.25, '½': 0.5, '¾': 0.75 };
  if (fractions[trimmed] != null) return String(fractions[trimmed]);

  const mixed = trimmed.match(/^(\d+)([¼½¾])$/);
  if (mixed) return String(parseInt(mixed[1], 10) + (fractions[mixed[2]] ?? 0));

  return trimmed;
}

/** 1-minute cooldown countdown hook */
function useCooldown(lastUsedAt: string | null | undefined) {
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const calcRemaining = useCallback(() => {
    if (!lastUsedAt) return 0;
    const elapsed = Date.now() - new Date(lastUsedAt).getTime();
    return Math.max(0, Math.ceil((60_000 - elapsed) / 1000));
  }, [lastUsedAt]);

  useEffect(() => {
    const tick = () => {
      const r = calcRemaining();
      setRemaining(r);
      if (r <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(tick, 1000);
    const timeoutId = setTimeout(tick, 0);
    return () => {
      clearTimeout(timeoutId);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [calcRemaining]);

  return remaining;
}

export default function RaceDetailPage() {
  const router = useRouter();
  const { id, view } = router.query;
  const isResultView = view === 'result';
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [pickType, setPickType] = useState<string>('SINGLE');
  const [selectedHorses, setSelectedHorses] = useState<{ hrNo: string; hrName: string }[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    data: race,
    isLoading,
    error,
    refetch: refetchRace,
  } = useQuery({
    queryKey: ['race', id],
    queryFn: () => RaceApi.getRace(id as string),
    enabled: !!id,
  });

  const isRaceCompleted =
    ((race as { status?: string; raceStatus?: string })?.status ??
      (race as { status?: string; raceStatus?: string })?.raceStatus) === 'COMPLETED';

  const { data: myPick } = useQuery({
    queryKey: ['picks', 'race', id],
    queryFn: () => PicksApi.getByRace(id as string),
    enabled: !!id && isLoggedIn && CONFIG.picksEnabled,
  });

  const { data: ticketBalance } = useQuery({
    queryKey: ['prediction-tickets', 'balance'],
    queryFn: () => PredictionTicketApi.getBalance(),
    enabled: !!id && isLoggedIn && !isRaceCompleted,
  });

  const { data: ticketHistory } = useQuery({
    queryKey: ['prediction-tickets', 'history'],
    queryFn: () => PredictionTicketApi.getHistory(100, 0, 1),
    enabled: !!id && isLoggedIn && !isRaceCompleted,
  });

  const hasUsedTicketForRace = !!ticketHistory?.tickets?.some(
    (t) => String(t.raceId) === String(id) && t.status === 'USED',
  );

  const { data: fullPredictionData } = useQuery({
    queryKey: ['prediction', 'full', id],
    queryFn: () => PredictionApi.getByRaceId(id as string),
    enabled: !!id && (isRaceCompleted || (isLoggedIn && !!hasUsedTicketForRace)),
  });

  const { data: predictionHistory } = useQuery({
    queryKey: ['prediction', 'history', id],
    queryFn: () => PredictionApi.getHistoryByRaceId(id as string),
    enabled: !!id && (isRaceCompleted || (isLoggedIn && !!hasUsedTicketForRace)),
  });

  const [selectedPredictionId, setSelectedPredictionId] = useState<number | null>(null);

  const { data: predictionPreview } = useQuery({
    queryKey: ['prediction', 'preview', id],
    queryFn: () => PredictionApi.getPreview(id as string),
    enabled: !!id && !isRaceCompleted && !hasUsedTicketForRace,
  });

  const [fullPredictionFromUse, setFullPredictionFromUse] = useState<PredictionDetailDto | null>(
    null,
  );

  const useTicketMutation = useMutation({
    mutationFn: ({ raceId, regenerate }: { raceId: string; regenerate?: boolean }) =>
      PredictionTicketApi.redeem(raceId, { regenerate }),
    onSuccess: (data) => {
      setFullPredictionFromUse(data.prediction);
      setSelectedPredictionId(null);
      queryClient.invalidateQueries({ queryKey: ['prediction', 'full', id] });
      queryClient.invalidateQueries({ queryKey: ['prediction', 'history', id] });
      queryClient.invalidateQueries({ queryKey: ['prediction-tickets', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['prediction-tickets', 'history'] });
    },
  });

  const list = predictionHistory ?? (fullPredictionData ? [fullPredictionData] : []);
  const displayPrediction =
    fullPredictionFromUse ??
    (selectedPredictionId != null
      ? list.find((p) => Number((p as unknown as { id?: number }).id) === selectedPredictionId)
      : list[0]);
  const availableTickets = ticketBalance?.availableTickets ?? ticketBalance?.available ?? 0;

  const { data: raceResults } = useQuery({
    queryKey: ['race', id, 'results'],
    queryFn: () => RaceApi.getRaceResults(id as string),
    enabled: !!id,
  });

  const { data: dividends } = useQuery({
    queryKey: ['race', id, 'dividends'],
    queryFn: () => RaceApi.getRaceDividends(id as string),
    enabled: !!id,
  });

  const [showJockeyAnalysis, setShowJockeyAnalysis] = useState(false);
  const {
    data: jockeyAnalysis,
    isLoading: jockeyLoading,
    error: jockeyError,
    refetch: refetchJockey,
  } = useQuery({
    queryKey: ['analysis', 'jockey', id],
    queryFn: () => AnalysisApi.getJockeyAnalysis(id as string),
    enabled: !!id && showJockeyAnalysis,
    retry: false,
  });

  useEffect(() => {
    const sync = () => {
      if (myPick) {
        setPickType(myPick.pickType);
        setSelectedHorses(
          (myPick.hrNos || []).map((hrNo, i) => ({
            hrNo,
            hrName: myPick.hrNames?.[i] ?? '',
          })),
        );
      } else {
        setSelectedHorses([]);
      }
    };
    queueMicrotask(sync);
  }, [myPick]);

  useEffect(() => {
    queueMicrotask(() => setSelectedHorses([]));
  }, [pickType]);

  const pickMutation = useMutation({
    mutationFn: (dto: { raceId: string; pickType: string; hrNos: string[]; hrNames: string[] }) =>
      PicksApi.create({ ...dto, raceId: parseInt(dto.raceId, 10) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['picks', 'race', id] });
      queryClient.invalidateQueries({ queryKey: ['picks'] });
      setDrawerOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (raceId: string) => PicksApi.delete(raceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['picks', 'race', id] });
      queryClient.invalidateQueries({ queryKey: ['picks'] });
      setSelectedHorses([]);
      setDrawerOpen(false);
    },
  });

  const requiredCount = PICK_TYPE_HORSE_COUNTS[pickType] ?? 1;

  const handleSelectHorse = (hrNo: string, hrName: string) => {
    const idx = selectedHorses.findIndex((h) => h.hrNo === hrNo);
    if (idx >= 0) {
      setSelectedHorses(selectedHorses.filter((_, i) => i !== idx));
      return;
    }
    if (selectedHorses.length >= requiredCount) {
      setSelectedHorses((prev) => {
        const next = [...prev];
        next[requiredCount - 1] = { hrNo, hrName };
        return next;
      });
    } else {
      setSelectedHorses((prev) => [...prev, { hrNo, hrName }]);
    }
  };

  const handleSave = () => {
    if (!id || typeof id !== 'string') return;
    if (selectedHorses.length !== requiredCount) return;
    pickMutation.mutate({
      raceId: id,
      pickType,
      hrNos: selectedHorses.map((h) => h.hrNo),
      hrNames: selectedHorses.map((h) => h.hrName),
    });
  };

  const handleDelete = () => {
    if (!id || typeof id !== 'string') return;
    deleteMutation.mutate(id);
  };

  const isHorseSelected = (hrNo: string) => selectedHorses.some((h) => h.hrNo === hrNo);

  if (isLoading) {
    return (
      <Layout>
        <div className='flex justify-center items-center h-[40vh] md:h-[50vh]'>
          <LoadingSpinner size={28} label='경주 정보 준비 중...' />
        </div>
      </Layout>
    );
  }

  if (error || !race) {
    return (
      <Layout>
        <div className='text-center p-6 md:p-8 msg-error'>
          <h2 className='text-lg md:text-xl font-bold mb-4'>경주를 찾을 수 없습니다</h2>
          <BackLink href={routes.home} label='목록으로' />
        </div>
      </Layout>
    );
  }

  const r = race as {
    rcName?: string;
    rcNo?: string;
    meetName?: string;
    rcDate?: string;
    rcDist?: string;
    stTime?: string;
    entries?: Array<{
      id?: string;
      raceId?: number;
      hrNo: string;
      hrName: string;
      jkName?: string;
      chulNo?: string;
      wgBudam?: number;
      horseWeight?: string;
      trName?: string;
      rating?: number;
      sex?: string;
      age?: number;
      prd?: string;
      rcCntT?: number;
      ord1CntT?: number;
      recentRanks?: unknown;
      equipment?: string;
      budam?: string;
    }>;
    entryDetails?: Array<{
      id?: string;
      raceId?: number;
      hrNo: string;
      hrName: string;
      jkName?: string;
      chulNo?: string;
      wgBudam?: number;
      horseWeight?: string;
      trName?: string;
      rating?: number;
      sex?: string;
      age?: number;
      prd?: string;
      rcCntT?: number;
      ord1CntT?: number;
      recentRanks?: unknown;
      equipment?: string;
      budam?: string;
    }>;
  };
  const entries = (r.entries ?? r.entryDetails ?? []) as Array<{
    id?: string;
    raceId?: number;
    hrNo: string;
    hrName: string;
    jkName?: string;
    chulNo?: string;
    wgBudam?: number;
    horseWeight?: string;
    trName?: string;
    rating?: number;
    sex?: string;
    age?: number;
    prd?: string;
    rcCntT?: number;
    ord1CntT?: number;
    recentRanks?: unknown;
    equipment?: string;
    budam?: string;
  }>;

  const hasResults = (raceResults?.length ?? 0) > 0;

  // Extract entry list from results data (fallback when entries is empty)
  const entriesFromResults = hasResults
    ? raceResults!.map((res) => ({
        hrNo: res.hrNo,
        hrName: res.hrName,
        jkName: res.jkName,
        chulNo: res.chulNo,
      }))
    : [];
  const displayEntries = entries.length > 0 ? entries : entriesFromResults;
  const showEntriesSection = displayEntries.length > 0;
  const showPickPanel = !isRaceCompleted && isLoggedIn && CONFIG.picksEnabled && entries.length > 0;

  const lastUsedTicket = ticketHistory?.tickets
    ?.filter((t) => String(t.raceId) === String(id) && t.status === 'USED')
    .sort((a, b) => new Date(b.usedAt ?? 0).getTime() - new Date(a.usedAt ?? 0).getTime())[0];

  return (
    <Layout title='OddsCast'>
      <div className='flex flex-col lg:flex-row lg:gap-6 lg:items-start'>
        <div className='flex-1 min-w-0 w-full space-y-4'>
          <BackLink
            href={isResultView ? routes.results : routes.home}
            label={isResultView ? '결과로' : '목록으로'}
            className='block'
          />

          {/* ── Race header ── */}
          <RaceHeaderCard
            meetName={r.meetName}
            rcDay={(r as { rcDay?: string }).rcDay}
            rcNo={r.rcNo}
            rcDate={r.rcDate}
            stTime={r.stTime}
            rcDist={r.rcDist}
            rank={(r as { rank?: string }).rank}
            rcCondition={(r as { rcCondition?: string }).rcCondition}
            rcPrize={(r as { rcPrize?: number }).rcPrize}
            weather={(r as { weather?: string }).weather}
            track={(r as { track?: string }).track}
          />

          {/* ── Race results (always show when race is completed; empty state if not synced yet) ── */}
          {(isRaceCompleted || hasResults) && (
            <section className='space-y-2'>
              <div className='flex items-center gap-1.5'>
                <Icon name='Trophy' size={15} className='text-stone-500' />
                <span className='text-sm font-bold text-foreground'>경주 결과</span>
              </div>

              {!hasResults ? (
                <div className='rounded-md border border-stone-200 bg-stone-50/50 px-4 py-6 text-center text-sm text-text-secondary'>
                  결과를 불러오는 중이거나 아직 반영되지 않았습니다. 잠시 후 새로고침 해 주세요.
                </div>
              ) : (
              <>
              {/* Full rankings — table format */}
              <div className='rounded-md border border-stone-200 overflow-hidden'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-stone-50 border-b border-stone-200 text-xs text-text-secondary'>
                      <th className='py-1.5 px-2 w-10 text-center font-semibold'>순위</th>
                      <th className='py-1.5 px-2 w-10 text-center font-semibold'>번호</th>
                      <th className='py-1.5 px-2 text-left font-semibold'>마명</th>
                      <th className='py-1.5 px-2 text-left font-semibold'>기수</th>
                      <th className='py-1.5 px-2 text-right font-semibold'>기록</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raceResults?.map((res, i) => {
                      const row = res as {
                        ordType?: string | null;
                        diffUnit?: string;
                        winOdds?: number;
                      };
                      const ord = String(res.ord ?? i + 1);
                      const ordN = parseInt(ord, 10);
                      const no = res.chulNo ?? (res.hrNo && res.hrNo.length <= 2 ? res.hrNo : '-');
                      const suffix =
                        row.ordType === 'FALL' ? ' (낙마)' : row.ordType === 'DQ' ? ' (실격)' : '';
                      const rankCls =
                        ordN === 1
                          ? 'text-foreground font-bold'
                          : ordN === 2
                            ? 'text-stone-600 font-bold'
                            : ordN === 3
                              ? 'text-stone-500 font-bold'
                              : 'text-text-tertiary';
                      const record =
                        ordN === 1 && res.rcTime ? res.rcTime : formatDiffUnit(row.diffUnit ?? '');
                      return (
                        <tr
                          key={res.id ?? i}
                          className='border-b border-stone-100 last:border-0 hover:bg-stone-50/50'
                        >
                          <td className={`py-1.5 px-2 text-center ${rankCls}`}>{ord}</td>
                          <td className='py-1.5 px-2 text-center font-semibold text-stone-700'>
                            {no}
                          </td>
                          <td className='py-1.5 px-2 font-medium text-foreground'>
                            {res.hrName}
                            {suffix}
                          </td>
                          <td className='py-1.5 px-2 text-text-secondary'>{res.jkName ?? ''}</td>
                          <td className='py-1.5 px-2 text-right text-text-tertiary font-mono text-xs'>
                            {record}
                            {row.winOdds != null && ordN === 1 && (
                              <span className='ml-1 text-stone-600'>{row.winOdds}배</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Dividends */}
              {(dividends?.length ?? 0) > 0 && (
                <div className='rounded-md border border-stone-200 overflow-hidden'>
                  <div className='bg-stone-50 border-b border-stone-200 px-2 py-1.5'>
                    <span className='text-xs font-semibold text-text-secondary'>배당</span>
                  </div>
                  <div className='grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-slate-100'>
                    {dividends
                      ?.slice(0, 12)
                      .map(
                        (
                          d: {
                            id?: string;
                            poolName?: string;
                            pool?: string;
                            chulNo?: string;
                            chulNo2?: string;
                            chulNo3?: string;
                            odds?: number;
                          },
                          i: number,
                        ) => {
                          const combo = [d.chulNo, d.chulNo2, d.chulNo3].filter(Boolean).join('-');
                          const label = d.poolName ?? d.pool ?? '배당';
                          return (
                            <div key={d.id ?? i} className='px-2.5 py-2'>
                              <span className='text-text-tertiary text-xs block'>{label}</span>
                              <span className='text-foreground font-semibold text-sm'>
                                {combo || '-'}
                              </span>
                              {d.odds != null && (
                                <span className='text-foreground font-semibold text-xs block'>
                                  {formatNumber(d.odds)}원
                                </span>
                              )}
                            </div>
                          );
                        },
                      )}
                  </div>
                </div>
              )}
              </>
              )}
            </section>
          )}

          {/* ── AI prediction ── */}
          <section>
            {displayPrediction ? (
              <PredictionFullView
                prediction={displayPrediction}
                list={list}
                selectedPredictionId={selectedPredictionId}
                setSelectedPredictionId={setSelectedPredictionId}
                entries={entries}
                availableTickets={availableTickets}
                useTicketMutation={useTicketMutation}
                raceId={id as string}
                lastUsedAt={lastUsedTicket?.usedAt ?? null}
                isRaceCompleted={isRaceCompleted}
              />
            ) : isRaceCompleted ? (
              <div className='rounded-md border border-stone-200 bg-stone-50 p-4 text-center'>
                <div className='w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-2 mx-auto'>
                  <Icon name='Target' size={20} className='text-stone-400' />
                </div>
                <p className='text-text-secondary text-sm'>이 경주에 대한 AI 예측이 없습니다.</p>
              </div>
            ) : (
              <PredictionLockedView
                predictionPreview={predictionPreview}
                isLoggedIn={isLoggedIn}
                availableTickets={availableTickets}
                useTicketMutation={useTicketMutation}
                raceId={id as string}
              />
            )}
          </section>

          {/* ── Entries ── */}
          {showEntriesSection && (
            <section>
              <div className='flex items-center gap-1.5 mb-2'>
                <Icon name='ClipboardList' size={15} className='text-text-secondary' />
                <span className='text-sm font-bold text-foreground'>출전마</span>
                <span className='text-xs text-text-tertiary'>{displayEntries.length}두</span>
              </div>
              {entries.length > 0 ? (
                <HorseEntryTable
                  entries={entries}
                  onSelectHorse={showPickPanel ? handleSelectHorse : undefined}
                  isSelected={isHorseSelected}
                />
              ) : displayEntries.length > 0 ? (
                <div className='space-y-1'>
                  {displayEntries.map((e, i) => {
                    const no = e.chulNo ?? (e.hrNo && String(e.hrNo).length <= 2 ? e.hrNo : '');
                    return (
                      <div
                        key={e.hrNo ?? i}
                        className='flex items-center gap-3 px-3 py-2 text-sm rounded-lg bg-stone-50/60'
                      >
                        {no && (
                          <span className='font-bold text-stone-600 w-7 text-center'>{no}번</span>
                        )}
                        <span className='text-foreground font-medium flex-1 truncate'>
                          {e.hrName}
                        </span>
                        {e.jkName && <span className='text-text-secondary'>{e.jkName}</span>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className='rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center'>
                  <p className='text-text-secondary text-sm'>출전마 정보가 없습니다.</p>
                  <button
                    type='button'
                    onClick={() => refetchRace()}
                    className='btn-secondary mt-3 text-sm px-3 py-1.5'
                  >
                    다시 시도
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ── Jockey·horse integrated analysis ── */}
          <section>
            <div className='flex items-center gap-1.5 mb-2'>
              <Icon name='BarChart2' size={15} className='text-text-secondary' />
              <span className='text-sm font-bold text-foreground'>기수·말 통합 분석</span>
            </div>
            {!showJockeyAnalysis ? (
              <button
                type='button'
                onClick={() => setShowJockeyAnalysis(true)}
                className='btn-secondary w-full sm:w-auto px-4 py-2 text-sm'
              >
                분석 보기
              </button>
            ) : jockeyLoading ? (
              <Card className='py-6'>
                <LoadingSpinner size={22} label='분석 중...' />
              </Card>
            ) : jockeyError ? (
              <Card className='py-4'>
                <p className='text-text-secondary text-sm'>분석 정보를 확인할 수 없습니다.</p>
                <button
                  type='button'
                  onClick={() => refetchJockey()}
                  className='btn-secondary mt-2 text-sm px-3 py-1.5'
                >
                  다시 시도
                </button>
              </Card>
            ) : jockeyAnalysis?.entriesWithScores?.length ? (
              <Card className='space-y-2'>
                {jockeyAnalysis.weightRatio && (
                  <p className='text-text-secondary text-sm'>
                    말 {Math.round(jockeyAnalysis.weightRatio.horse * 100)}% · 기수{' '}
                    {Math.round(jockeyAnalysis.weightRatio.jockey * 100)}%
                  </p>
                )}
                <div className='space-y-1'>
                  {jockeyAnalysis.entriesWithScores
                    .slice(0, 10)
                    .map(
                      (e: {
                        hrNo: string;
                        hrName: string;
                        jkName?: string;
                        chulNo?: string;
                        combinedScore?: number;
                      }) => {
                        const no = e.chulNo ?? (e.hrNo && String(e.hrNo).length <= 2 ? e.hrNo : '');
                        return (
                          <div
                            key={e.hrNo}
                            className='flex items-center justify-between py-1.5 border-b border-border last:border-0 text-sm'
                          >
                            <span className='text-foreground font-medium'>
                              {no ? `${no}번 ` : ''}
                              {e.hrName}{' '}
                              <span className='text-text-secondary font-normal'>({e.jkName})</span>
                            </span>
                            <span className='text-stone-700 font-bold text-base'>
                              {Math.round(e.combinedScore ?? 0)}
                            </span>
                          </div>
                        );
                      },
                    )}
                </div>
                {jockeyAnalysis.topPickByJockey && (
                  <div className='pt-2 border-t border-border'>
                    <p className='text-text-secondary text-xs mb-0.5'>기수 점수 1위</p>
                    <p className='text-stone-700 font-bold text-sm'>
                      {jockeyAnalysis.topPickByJockey.hrName} ·{' '}
                      {jockeyAnalysis.topPickByJockey.jkName}
                    </p>
                  </div>
                )}
              </Card>
            ) : (
              <p className='text-text-secondary text-sm'>분석 결과가 없습니다.</p>
            )}
          </section>
        </div>

        {/* Desktop sidebar */}
        {showPickPanel && (
          <aside className='hidden lg:block w-80 shrink-0'>
            <div className='lg:sticky lg:top-24 rounded-2xl border border-border bg-card p-4'>
              <HorsePickPanel
                pickType={pickType}
                setPickType={setPickType}
                selectedHorses={selectedHorses}
                entries={entries}
                requiredCount={requiredCount}
                dividends={dividends}
                onSelectHorse={handleSelectHorse}
                onSave={handleSave}
                onDelete={handleDelete}
                hasPick={!!myPick}
                isSaving={pickMutation.isPending}
                isDeleting={deleteMutation.isPending}
              />
            </div>
          </aside>
        )}

        {/* Mobile Drawer */}
        {showPickPanel && (
          <>
            <button
              onClick={() => setDrawerOpen(true)}
              className='lg:hidden fixed right-4 z-20 flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg touch-manipulation'
              style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
              aria-label='출전마 고르기'
            >
              <Icon name='ClipboardList' size={20} />
              <span>
                출전마 고르기
                {selectedHorses.length > 0 && (
                  <span className='ml-1 opacity-90'>
                    ({selectedHorses.length}/{requiredCount})
                  </span>
                )}
              </span>
            </button>
            {drawerOpen && (
              <>
                <div
                  className='lg:hidden fixed inset-0 z-40 bg-black/50'
                  onClick={() => setDrawerOpen(false)}
                  aria-hidden='true'
                />
                <div className='lg:hidden fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-3xl bg-background-elevated border-t border-border overflow-hidden flex flex-col'>
                  <div className='flex items-center justify-between p-4 border-b border-border shrink-0'>
                    <h3 className='text-lg font-bold text-stone-800'>출전마 선택</h3>
                    <button
                      onClick={() => setDrawerOpen(false)}
                      className='p-2 -mr-2 text-text-secondary hover:text-foreground rounded-xl'
                      aria-label='닫기'
                    >
                      <Icon name='X' size={24} />
                    </button>
                  </div>
                  <div className='flex-1 overflow-y-auto p-4 pb-8'>
                    <HorsePickPanel
                      pickType={pickType}
                      setPickType={setPickType}
                      selectedHorses={selectedHorses}
                      entries={entries}
                      requiredCount={requiredCount}
                      dividends={dividends}
                      onSelectHorse={handleSelectHorse}
                      onSave={handleSave}
                      onDelete={handleDelete}
                      hasPick={!!myPick}
                      isSaving={pickMutation.isPending}
                      isDeleting={deleteMutation.isPending}
                      compact
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

// ─── Full prediction view (after using ticket) ───

interface TicketMutationLike {
  mutate: (vars: { raceId: string; regenerate?: boolean }) => void;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}

interface PredictionFullViewProps {
  prediction: PredictionDetailDto;
  list: PredictionDetailDto[];
  selectedPredictionId: number | null;
  setSelectedPredictionId: (id: number | null) => void;
  entries: Array<{ hrNo: string; hrName: string; chulNo?: string; [k: string]: unknown }>;
  availableTickets: number;
  useTicketMutation: TicketMutationLike;
  raceId: string;
  lastUsedAt: string | null;
  isRaceCompleted?: boolean;
}

function PredictionFullView({
  prediction,
  list,
  selectedPredictionId,
  setSelectedPredictionId,
  entries,
  availableTickets,
  useTicketMutation,
  raceId,
  lastUsedAt,
  isRaceCompleted,
}: PredictionFullViewProps) {
  const cooldownRemaining = useCooldown(lastUsedAt);
  const isCoolingDown = cooldownRemaining > 0;

  return (
    <div className='space-y-4'>
      {/* Header: prediction history + regenerate */}
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-1.5'>
          <Icon name='Target' size={15} className='text-stone-500' />
          <span className='text-sm font-bold text-foreground'>AI 예측</span>
          {list.length > 1 && <span className='text-text-tertiary text-xs'>({list.length}건)</span>}
        </div>
        {!isRaceCompleted && availableTickets > 0 && (
          <button
            type='button'
            onClick={() => {
              trackCTA('PREDICTION_REGENERATE', raceId);
              useTicketMutation.mutate({ raceId, regenerate: true });
            }}
            disabled={useTicketMutation.isPending || isCoolingDown}
            className='btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1 shrink-0'
          >
            {useTicketMutation.isPending ? (
              <>
                <Icon name='Loader2' size={14} className='animate-spin' />
                생성 중...
              </>
            ) : isCoolingDown ? (
              <>
                <Icon name='Clock' size={14} />
                {cooldownRemaining}초 후 가능
              </>
            ) : (
              <>
                <Icon name='RefreshCw' size={14} />
                다시 예측
              </>
            )}
          </button>
        )}
      </div>

      {/* Prediction history tabs (2 or more) */}
      {list.length > 1 && (
        <div className='flex gap-1.5 overflow-x-auto pb-1'>
          {list.map((p, i) => {
            const pid = Number((p as unknown as { id?: number }).id ?? i);
            const isActive =
              pid === (selectedPredictionId ?? Number((list[0] as unknown as { id?: number })?.id));
            const createdAt = (p as unknown as { createdAt?: string }).createdAt;
            let timeStr = '';
            try {
              if (createdAt) timeStr = formatTime(createdAt);
            } catch {
              /* */
            }
            return (
              <button
                key={pid}
                onClick={() => setSelectedPredictionId(pid)}
                className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-stone-100 text-text-secondary hover:bg-stone-200'
                }`}
              >
                {i === 0 ? '최신' : `${list.length - i}번째`}
                {timeStr && <span className='ml-1 opacity-75'>{timeStr}</span>}
              </button>
            );
          })}
        </div>
      )}

      {useTicketMutation.isError && (
        <p className='msg-error text-sm'>{getErrorMessage(useTicketMutation.error)}</p>
      )}

      {prediction?.scores?.horseScores?.length ? (
        <>
          {/* 3 types of recommended bets */}
          {(prediction.scores?.betTypePredictions || prediction.scores?.horseScores?.length) &&
            entries.length > 0 && (
              <BetTypePredictionsSection
                betTypePredictions={prediction.scores.betTypePredictions}
                horseScores={prediction.scores.horseScores}
                entries={entries}
              />
            )}

          {/* Horse rankings */}
          <div>
            <p className='text-xs text-text-secondary font-semibold mb-1.5'>
              AI 추천 순위 <span className='text-text-tertiary font-normal'>(참고용)</span>
            </p>
            <div className='rounded-md border border-stone-200 overflow-hidden'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='bg-stone-50 border-b border-stone-200 text-xs text-text-secondary'>
                    <th className='py-1.5 px-2 w-8 text-center'>순위</th>
                    <th className='py-1.5 px-2 w-10 text-center'>번호</th>
                    <th className='py-1.5 px-2 text-left'>마명</th>
                    <th className='py-1.5 px-2 text-right w-12'>점수</th>
                  </tr>
                </thead>
                <tbody>
                  {prediction.scores!.horseScores!.map((h, i) => {
                    const no = h.chulNo ?? (h.hrNo && String(h.hrNo).length <= 2 ? h.hrNo : '');
                    const rankCls =
                      i === 0
                        ? 'text-foreground font-bold'
                        : i === 1
                          ? 'text-stone-600 font-bold'
                          : i === 2
                            ? 'text-stone-500 font-bold'
                            : 'text-text-tertiary';
                    return (
                      <tr key={i} className='border-b border-stone-100 last:border-0'>
                        <td className='py-1.5 px-2 text-center'>
                          <PredictionSymbol type={scoreToSymbol(i + 1)} size='sm' />
                        </td>
                        <td className='py-1.5 px-2 text-center font-semibold text-stone-600'>
                          {no}
                        </td>
                        <td className='py-1.5 px-2'>
                          <span className='font-medium text-foreground'>
                            {h.hrName ?? h.horseName ?? '-'}
                          </span>
                          {h.reason && (
                            <p className='text-text-tertiary text-xs line-clamp-1 mt-0.5'>
                              {h.reason}
                            </p>
                          )}
                        </td>
                        <td className={`py-1.5 px-2 text-right font-bold ${rankCls}`}>
                          {h.score != null ? Math.round(h.score) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI analysis */}
          {prediction.analysis && (
            <div>
              <p className='text-xs text-text-secondary font-semibold mb-1.5'>AI 상세 분석</p>
              <div className='p-3 rounded-md bg-stone-50 border border-stone-200'>
                <p className='text-text-secondary text-sm leading-relaxed whitespace-pre-wrap'>
                  {prediction.analysis}
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className='text-text-secondary text-sm'>
          {prediction.analysis || 'AI 분석 내용이 없습니다.'}
        </p>
      )}
    </div>
  );
}

// ─── Prediction locked (ticket not used) ───

interface PredictionLockedViewProps {
  predictionPreview?: { preview?: string } | null;
  isLoggedIn: boolean;
  availableTickets: number;
  useTicketMutation: TicketMutationLike;
  raceId: string;
}

function PredictionLockedView({
  predictionPreview,
  isLoggedIn,
  availableTickets,
  useTicketMutation,
  raceId,
}: PredictionLockedViewProps) {
  return (
    <div className='relative overflow-hidden rounded-md border border-stone-200 bg-stone-50'>
      <div className='absolute inset-0 p-3 opacity-15' aria-hidden>
        <div className='space-y-2'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='h-4 bg-stone-200 rounded w-full'
              style={{ maxWidth: `${90 - i * 8}%` }}
            />
          ))}
        </div>
      </div>
      <div className='absolute inset-0 backdrop-blur-sm bg-white/60' aria-hidden />
      <div className='relative z-10 p-4 text-center flex flex-col items-center'>
        <div className='w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-2'>
          <Icon name='Target' size={20} className='text-stone-500' />
        </div>
        {predictionPreview?.preview && (
          <div className='mb-3 p-2.5 rounded-md bg-white border border-border max-w-md'>
            <p className='text-foreground text-sm leading-relaxed line-clamp-2'>
              {predictionPreview.preview}
            </p>
          </div>
        )}
        <p className='text-foreground font-bold text-sm mb-0.5'>AI 예측 분석</p>
        <p className='text-text-secondary text-xs mb-3'>승률 점수 · 추천식 · 상세 분석</p>
        {isLoggedIn && availableTickets > 0 && (
          <>
            <p className='text-text-secondary text-sm mb-3'>잔여 예측권 {availableTickets}장</p>
            <button
              onClick={() => {
                trackCTA('PREDICTION_TICKET_USE', raceId);
                useTicketMutation.mutate({ raceId });
              }}
              disabled={useTicketMutation.isPending}
              className='btn-primary px-5 py-2.5 text-sm flex items-center gap-2'
            >
              {useTicketMutation.isPending ? (
                <>
                  <Icon name='Loader2' size={18} className='animate-spin' />
                  AI 분석 생성 중...
                </>
              ) : (
                <>
                  <Icon name='Target' size={18} />
                  예측권 1장 사용
                </>
              )}
            </button>
            {useTicketMutation.isError && (
              <p className='msg-error mt-3'>{getErrorMessage(useTicketMutation.error)}</p>
            )}
          </>
        )}
        {isLoggedIn && availableTickets === 0 && (
          <p className='text-text-secondary text-sm'>
            예측권이 없습니다.{' '}
            <Link href={routes.profile.index} className='text-primary hover:underline font-medium'>
              충전하기
            </Link>
          </p>
        )}
        {!isLoggedIn && (
          <p className='text-text-secondary text-sm'>
            <Link href={routes.auth.login} className='text-primary font-medium hover:underline'>
              로그인
            </Link>
            후 예측권으로 AI 분석을 확인하세요.
          </p>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.params?.id as string | undefined;
  const queryClient = new QueryClient();
  if (id) {
    try {
      await queryClient.prefetchQuery({
        queryKey: ['race', id],
        queryFn: () => serverGet<unknown>(`/races/${id}`),
      });
    } catch {
      // Fetch on client if SSR fails
    }
  }
  return { props: { dehydratedState: dehydrate(queryClient) } };
};
