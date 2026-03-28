import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useCoachMarkStore } from '@/lib/coachMark/coachMarkStore';
import { raceDetailTourSteps } from '@/lib/coachMark/tours/raceDetailTour';

const CoachMarkTour = dynamic(
  () => import('@/components/coach-mark/CoachMarkTour'),
  { ssr: false },
);
import type { GetServerSideProps } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { serverGet } from '@/lib/api/serverFetch';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge, SectionTitle } from '@/components/ui';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import Tooltip from '@/components/ui/SimpleTooltip';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import LoadingSpinner from '@/components/LoadingSpinner';
import RaceHeaderCard from '@/components/race/RaceHeaderCard';
import HorseEntryTable from '@/components/race/HorseEntryTable';
import PredictionSymbol, { scoreToSymbol } from '@/components/race/PredictionSymbol';
import RaceApi from '@/lib/api/raceApi';
import BetTypePredictionsSection from '@/components/predictions/BetTypePredictionsSection';
import HorseScoresBarChart from '@/components/predictions/HorseScoresBarChart';
import PredictionResultComparison from '@/components/predictions/PredictionResultComparison';
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
import { formatTime, isRaceActuallyEnded, formatRaceTime, formatDiffUnit } from '@/lib/utils/format';
import { pushRecentRaceId } from '@/lib/utils/recentRaces';

/** ordType → 비고 라벨 (낙마/실격/기권). NORMAL·null이면 빈 문자열 */
function formatOrdTypeLabel(ordType: string | null | undefined): string {
  if (!ordType || ordType === 'NORMAL') return '';
  const map: Record<string, string> = { FALL: '낙마', DQ: '실격', WITHDRAWN: '기권' };
  return map[ordType] ?? '';
}


function getFirstPlaceTimeSec(
  results: Array<{ ord?: unknown; ordType?: string | null; rcTime?: string | null }>
): number | null {
  const first = results.find(
    (r) =>
      parseInt(String(r.ord ?? ''), 10) === 1 &&
      !r.ordType &&
      r.rcTime != null &&
      r.rcTime !== ''
  );
  if (!first?.rcTime) return null;
  const val = parseFloat(String(first.rcTime));
  return Number.isFinite(val) ? val : null;
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
  const { id } = router.query;
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { shouldAutoStart, startTour } = useCoachMarkStore();

  useEffect(() => {
    if (!shouldAutoStart('raceDetailTour', isLoggedIn)) return;
    const timer = setTimeout(() => startTour('raceDetailTour'), 800);
    return () => clearTimeout(timer);
  }, [isLoggedIn, shouldAutoStart, startTour]);
  const {
    data: race,
    isLoading,
    error,
    refetch: refetchRace,
  } = useQuery({
    queryKey: ['race', id],
    queryFn: () => RaceApi.getRace(id as string),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });

  const raceStatus =
    (race as { status?: string; raceStatus?: string })?.status ??
    (race as { status?: string; raceStatus?: string })?.raceStatus;
  const rcDate = (race as { rcDate?: string })?.rcDate;
  const stTime = (race as { stTime?: string })?.stTime;
  // Race is over when server says COMPLETED, OR when start time + buffer has passed (even if results not yet synced).
  const isServerCompleted = raceStatus === 'COMPLETED';
  const isTimeElapsed = isRaceActuallyEnded(rcDate, stTime);
  const isRaceCompleted = isServerCompleted || isTimeElapsed;

  const { data: ticketBalance } = useQuery({
    queryKey: ['prediction-tickets', 'balance'],
    queryFn: () => PredictionTicketApi.getBalance(),
    enabled: !!id && isLoggedIn,
    placeholderData: keepPreviousData,
  });

  const { data: ticketHistory } = useQuery({
    queryKey: ['prediction-tickets', 'history'],
    queryFn: () => PredictionTicketApi.getHistory(100, 0, 1),
    enabled: !!id && isLoggedIn && !isRaceCompleted,
    placeholderData: keepPreviousData,
  });

  // Optimistic lock: prevent double ticket consumption between mutation settle and query refetch
  const [ticketConsumedForRace, setTicketConsumedForRace] = useState(false);

  // Reset local state when race id changes (prevents stale data across navigation)
  useEffect(() => {
    setFullPredictionFromUse(null);
    setTicketConsumedForRace(false);
    setSelectedPredictionId(null);
  }, [id]);

  const hasUsedTicketFromHistory = !!ticketHistory?.tickets?.some(
    (t) => String(t.raceId) === String(id) && t.status === 'USED',
  );
  const hasUsedTicketForRace = hasUsedTicketFromHistory || ticketConsumedForRace;

  const { data: fullPredictionData } = useQuery({
    queryKey: ['prediction', 'full', id],
    queryFn: () => PredictionApi.getByRaceId(id as string),
    enabled: !!id && (isRaceCompleted || (isLoggedIn && hasUsedTicketForRace)),
    placeholderData: keepPreviousData,
  });

  const { data: predictionHistory } = useQuery({
    queryKey: ['prediction', 'history', id],
    queryFn: () => PredictionApi.getHistoryByRaceId(id as string),
    enabled: !!id && (isRaceCompleted || (isLoggedIn && hasUsedTicketForRace)),
    placeholderData: keepPreviousData,
  });

  const [selectedPredictionId, setSelectedPredictionId] = useState<number | null>(null);
  const [oddsExplainOpen, setOddsExplainOpen] = useState(false);

  const { data: predictionPreview } = useQuery({
    queryKey: ['prediction', 'preview', id],
    queryFn: () => PredictionApi.getPreview(id as string),
    enabled: !!id && !isRaceCompleted && !hasUsedTicketForRace,
    placeholderData: keepPreviousData,
  });

  const [fullPredictionFromUse, setFullPredictionFromUse] = useState<PredictionDetailDto | null>(
    null,
  );

  const useTicketMutation = useMutation({
    mutationFn: ({ raceId, regenerate }: { raceId: string; regenerate?: boolean }) =>
      PredictionTicketApi.redeem(raceId, { regenerate }),
    onMutate: () => {
      setTicketConsumedForRace(true);
    },
    onSuccess: (data) => {
      setFullPredictionFromUse(data.prediction);
      setSelectedPredictionId(null);
      queryClient.invalidateQueries({ queryKey: ['prediction', 'full', id] });
      queryClient.invalidateQueries({ queryKey: ['prediction', 'history', id] });
      queryClient.invalidateQueries({ queryKey: ['prediction-tickets', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['prediction-tickets', 'history'] });
    },
    onError: () => {
      // Revert optimistic lock on failure so user can retry
      setTicketConsumedForRace(false);
    },
  });

  const list = predictionHistory ?? (fullPredictionData ? [fullPredictionData] : []);
  const displayPrediction =
    fullPredictionFromUse ??
    (selectedPredictionId != null
      ? list.find((p) => Number(p.id) === selectedPredictionId)
      : list[0]);
  const availableTickets = ticketBalance?.availableTickets ?? ticketBalance?.available ?? 0;

  const { data: raceResults } = useQuery({
    queryKey: ['race', id, 'results'],
    queryFn: () => RaceApi.getRaceResults(id as string),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });

  const { data: dividends } = useQuery({
    queryKey: ['race', id, 'dividends'],
    queryFn: () => RaceApi.getRaceDividends(id as string),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });

  const {
    data: jockeyAnalysis,
    isLoading: jockeyLoading,
    error: jockeyError,
    refetch: refetchJockey,
  } = useQuery({
    queryKey: ['analysis', 'jockey', id],
    queryFn: () => AnalysisApi.getJockeyAnalysis(id as string),
    enabled: !!id,
    retry: false,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (id && typeof id === 'string') pushRecentRaceId(id);
  }, [id]);

  // Compute effectiveResults before early returns so hooks are always called in same order
  type ResultRow = {
    id?: number;
    ord?: string | number;
    ordType?: string | null;
    chulNo?: string;
    hrNo?: string;
    hrName?: string;
    jkName?: string;
    trName?: string;
    rcTime?: string | null;
    diffUnit?: string | null;
    winOdds?: number;
    plcOdds?: number;
    [k: string]: unknown;
  };
  const effectiveResults = useMemo((): ResultRow[] => {
    if (!race) return [];
    const r = race as { results?: ResultRow[] };
    const resultsEmbedded = r.results ?? [];
    if ((raceResults?.length ?? 0) > 0) return (raceResults ?? []) as unknown as ResultRow[];
    if (Array.isArray(resultsEmbedded) && resultsEmbedded.length > 0) return resultsEmbedded;
    return [];
  }, [race, raceResults]);

  const oddsMap = useMemo(() => {
    if (!isRaceCompleted || effectiveResults.length === 0) return undefined;
    const map = new Map<string, { winOdds?: number; plcOdds?: number }>();
    for (const res of effectiveResults as Array<{ hrNo?: string; winOdds?: number; plcOdds?: number }>) {
      if (res.hrNo && (res.winOdds != null || res.plcOdds != null)) {
        map.set(res.hrNo, { winOdds: res.winOdds, plcOdds: res.plcOdds });
      }
    }
    return map.size > 0 ? map : undefined;
  }, [isRaceCompleted, effectiveResults]);

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
        <div className='text-center p-6 md:p-8'>
          <h2 className='text-lg md:text-xl font-bold mb-2 text-foreground'>경주를 찾을 수 없습니다</h2>
          <p className='text-text-secondary text-sm mb-4'>일시적인 오류일 수 있습니다. 다시 시도해 보세요.</p>
          <div className='flex flex-col sm:flex-row items-center justify-center gap-3'>
            <Button
              type='button'
              onClick={() => refetchRace()}
              aria-label='다시 시도'
            >
              다시 시도
            </Button>
          </div>
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
    /** Results embedded in GET /races/:id (RACE_INCLUDE_FULL); use as fallback when GET /races/:id/results is empty */
    results?: Array<{
      id?: number;
      ord?: string | number;
      ordType?: string | null;
      chulNo?: string;
      hrNo?: string;
      hrName?: string;
      jkName?: string;
      trName?: string;
      rcTime?: string | null;
      diffUnit?: string | null;
      winOdds?: number;
      plcOdds?: number;
      [k: string]: unknown;
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

  const hasResults = effectiveResults.length > 0;
  const firstPlaceTimeSec = getFirstPlaceTimeSec(effectiveResults);

  // Extract entry list from results data (fallback when entries is empty)
  const entriesFromResults = hasResults
    ? effectiveResults.map((res) => ({
        hrNo: res.hrNo ?? '',
        hrName: res.hrName ?? '',
        jkName: res.jkName ?? '',
        chulNo: res.chulNo ?? '',
      }))
    : [];
  const displayEntries = entries.length > 0 ? entries : entriesFromResults;
  const showEntriesSection = displayEntries.length > 0;
  const lastUsedTicket = ticketHistory?.tickets
    ?.filter((t) => String(t.raceId) === String(id) && t.status === 'USED')
    .sort((a, b) => new Date(b.usedAt ?? 0).getTime() - new Date(a.usedAt ?? 0).getTime())[0];

  return (
    <Layout title='경주 상세 | OddsCast' description='경주 출전마 정보, AI 예측 분석, 경주 결과를 상세히 확인하세요.'>
      <CoachMarkTour tourId='raceDetailTour' steps={raceDetailTourSteps} />
      <div className='flex flex-col lg:flex-row lg:gap-6 lg:items-start'>
        <div className='flex-1 min-w-0 w-full space-y-4'>
          <CompactPageTitle
            title={r.meetName && r.rcNo ? `${r.meetName} ${r.rcNo}경주` : '경주 상세'}
            backHref={routes.races.list}
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
            budam={(r as { budam?: string }).budam ?? (entries[0] as { budam?: string } | undefined)?.budam}
            rcPrize={(r as { rcPrize?: number }).rcPrize}
            weather={(r as { weather?: string }).weather}
            track={(r as { track?: string }).track}
          />

          {/* ── AI prediction (hidden for completed races) ── */}
          {!isRaceCompleted && (
          <section>
            <span data-tour="race-detail-ai" className='block h-0' />
            <SectionTitle
              title='AI 예측'
              icon='Target'
              badge={
                isLoggedIn && availableTickets > 0
                  ? `예측권 ${availableTickets}장`
                  : displayPrediction
                    ? '열람 중'
                    : undefined
              }
              className='mb-2'
            />
            {displayPrediction?.scores?.horseScores && displayPrediction.scores.horseScores.length > 0 && (
              <p className='mb-2 text-sm text-text-secondary'>
                <Link href={routes.races.simulator(id as string)} className='text-primary hover:underline inline-flex items-center gap-1'>
                  가중치를 조절해 보기
                  <Icon name='ChevronRight' size={14} />
                </Link>
                {' → 커스텀 예측 시뮬레이터'}
              </p>
            )}
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
          )}

          {/* ── Race results (same section/table style as 출전마) ── */}
          {(isRaceCompleted || hasResults) && (
            <section>
              <SectionTitle
                title='경주 결과'
                icon='Trophy'
                badge={hasResults && effectiveResults.length > 0 ? `${effectiveResults.length}두` : undefined}
                className='mb-2'
              />
              {hasResults && CONFIG.kra?.replayPortalUrl && (
                <p className='mb-3 text-sm'>
                  <a
                    href={CONFIG.kra.replayPortalUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary font-medium hover:underline inline-flex items-center gap-1'
                  >
                    경주 영상 보기 (한국마사회)
                    <span aria-hidden>↗</span>
                  </a>
                </p>
              )}

              {!hasResults ? (
                <div className='rounded-xl border border-border bg-muted/20 px-4 py-6 text-center text-text-secondary'>
                  <p className='text-sm'>결과를 불러오는 중이거나 아직 반영되지 않았습니다.</p>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => { refetchRace(); }}
                    className='mt-3'
                  >
                    <Icon name='RefreshCw' size={14} />
                    새로고침
                  </Button>
                </div>
              ) : (
              <>
              {/* Mobile: result cards */}
              <div className='block sm:hidden space-y-2'>
                {effectiveResults.map((res, i) => {
                  const mrow = res as { ordType?: string | null; diffUnit?: string; winOdds?: number; plcOdds?: number; trName?: string | null; wgHr?: string | null };
                  const mordStr = String(res.ord ?? i + 1);
                  const mordN = parseInt(mordStr, 10);
                  const mAbnormal = !mrow.ordType && mordN >= 90;
                  const mOrdType = mrow.ordType ?? (mAbnormal ? 'DQ' : null);
                  const mLabel = formatOrdTypeLabel(mOrdType);
                  const mTimeSec = res.rcTime != null && res.rcTime !== '' ? parseFloat(String(res.rcTime)) : NaN;
                  const mHasTime = Number.isFinite(mTimeSec);
                  const mRecord = mHasTime && !mOrdType
                    ? mordN === 1
                      ? formatRaceTime(mTimeSec)
                      : firstPlaceTimeSec != null
                        ? `${formatRaceTime(mTimeSec)} (${mTimeSec >= firstPlaceTimeSec ? '+' : ''}${(mTimeSec - firstPlaceTimeSec).toFixed(1)}초)`
                        : formatRaceTime(mTimeSec)
                    : formatDiffUnit(mrow.diffUnit);
                  const mRankStyle = !mOrdType && mordN === 1 ? 'bg-amber-400 text-white' : !mOrdType && mordN === 2 ? 'bg-stone-400 text-white' : !mOrdType && mordN === 3 ? 'bg-amber-700 text-white' : 'bg-stone-100 text-text-tertiary';
                  return (
                    <div key={typeof res.id !== 'undefined' ? String(res.id) : `mr-${i}`} className='rounded-xl border border-border bg-card p-3 flex items-start gap-3'>
                      <div className='flex flex-col items-center gap-1.5 shrink-0 pt-0.5'>
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${mRankStyle}`}>
                          {mOrdType ? '—' : mordStr}
                        </span>
                        {res.chulNo != null && res.chulNo !== '' && (
                          <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-700 text-white text-[11px] font-bold'>
                            {res.chulNo}
                          </span>
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          {res.hrNo ? (
                            <Link href={routes.horses.detail(res.hrNo)} className='font-semibold text-foreground hover:text-primary hover:underline'>{res.hrName}</Link>
                          ) : (
                            <span className='font-semibold text-foreground'>{res.hrName}</span>
                          )}
                          {mLabel && (
                            <Badge variant={mOrdType === 'FALL' ? 'warning' : mOrdType === 'DQ' ? 'error' : 'muted'} size='sm'>{mLabel}</Badge>
                          )}
                        </div>
                        <div className='flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-text-secondary'>
                          {res.jkName && (
                            (res as { jkNo?: string }).jkNo
                              ? <Link href={routes.jockeys.detail((res as { jkNo: string }).jkNo)} className='hover:text-primary hover:underline'>{res.jkName}</Link>
                              : <span>{res.jkName}</span>
                          )}
                          {mrow.trName && <span className='text-text-tertiary'>{mrow.trName}</span>}
                        </div>
                        <div className='flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-text-tertiary'>
                          {mRecord && <span className='font-mono'>{mRecord}</span>}
                          {mrow.winOdds != null && !mOrdType && <span>단승 {mrow.winOdds}</span>}
                          {mrow.plcOdds != null && !mOrdType && <span>연승 {mrow.plcOdds}</span>}
                          {mrow.wgHr && <span>마체중 {mrow.wgHr}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Desktop: full results table */}
              <div className='hidden sm:block rounded-xl border border-border overflow-hidden shadow-sm overflow-x-auto'>
                <Table className='w-full min-w-[640px] [&_th]:py-3 [&_td]:py-2.5'>
                  <TableHeader>
                    <TableRow className='hover:bg-transparent bg-stone-50 border-b border-border text-xs text-text-secondary'>
                      <TableHead className='text-center w-10'>순위</TableHead>
                      <TableHead className='text-center w-10'>번호</TableHead>
                      <TableHead className='text-left min-w-[90px]'>마명</TableHead>
                      <TableHead className='text-center w-12'>성별</TableHead>
                      <TableHead className='text-center w-12'>연령</TableHead>
                      <TableHead className='text-right w-12'>중량</TableHead>
                      <TableHead className='text-left w-20'>기수</TableHead>
                      <TableHead className='text-left w-20'>조교사</TableHead>
                      <TableHead className='text-left w-20'>마주</TableHead>
                      <TableHead className='text-right min-w-[100px]'>
                        <Tooltip
                          content='각 말의 완주 시간(분:초). 2등 이하는 1등과의 초 차이를 +/−로 표시.'
                          inline
                        >
                          <span>기록</span>
                        </Tooltip>
                      </TableHead>
                      <TableHead className='text-right w-16'>마체중</TableHead>
                      <TableHead className='text-right w-14'>단승</TableHead>
                      <TableHead className='text-right w-14'>연승</TableHead>
                      <TableHead className='text-left w-24'>장구</TableHead>
                      <TableHead className='text-center w-16'>
                        <Tooltip
                          content='낙마·실격·기권 등 비정상 결과를 표시합니다.'
                          inline
                        >
                          <span>비고</span>
                        </Tooltip>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {effectiveResults.map((res, i) => {
                        const row = res as {
                          ordType?: string | null;
                          diffUnit?: string;
                          winOdds?: number;
                          plcOdds?: number;
                          age?: string | null;
                          sex?: string | null;
                          trName?: string | null;
                          owName?: string | null;
                          wgBudam?: number | null;
                          wgHr?: string | null;
                          hrTool?: string | null;
                        };
                        const ordStr = String(res.ord ?? i + 1);
                        const ordN = parseInt(ordStr, 10);
                        const isAbnormalOrd = !row.ordType && ordN >= 90;
                        const displayOrdType = row.ordType ?? (isAbnormalOrd ? 'DQ' : null);
                        const ordTypeLabel = formatOrdTypeLabel(displayOrdType);
                        const rcTimeSec =
                          res.rcTime != null && res.rcTime !== ''
                            ? parseFloat(String(res.rcTime))
                            : NaN;
                        const hasTime = Number.isFinite(rcTimeSec);
                        const record =
                          hasTime && !displayOrdType
                            ? ordN === 1
                              ? formatRaceTime(rcTimeSec)
                              : firstPlaceTimeSec != null
                                ? `${formatRaceTime(rcTimeSec)} (${rcTimeSec >= firstPlaceTimeSec ? '+' : ''}${(rcTimeSec - firstPlaceTimeSec).toFixed(1)}초)`
                                : formatRaceTime(rcTimeSec)
                            : formatDiffUnit(row.diffUnit);
                        const rawOrd = String(res.ord ?? '').trim();
                        const hasReason = rawOrd && !/^\d{1,2}$/.test(rawOrd);
                        const remarkTooltip = hasReason
                          ? rawOrd
                          : displayOrdType === 'DQ'
                            ? '실격 처리 (KRA 기준)'
                            : displayOrdType === 'FALL'
                              ? '낙마'
                              : '기권';
                      return (
                        <TableRow
                          key={typeof res.id !== 'undefined' ? String(res.id) : `result-${i}`}
                        >
                          <TableCell className='text-center'>
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              !displayOrdType && ordN === 1 ? 'bg-amber-400 text-white' :
                              !displayOrdType && ordN === 2 ? 'bg-stone-400 text-white' :
                              !displayOrdType && ordN === 3 ? 'bg-amber-700 text-white' :
                              'bg-stone-100 text-text-tertiary'
                            }`}>
                              {displayOrdType ? '—' : ordStr}
                            </span>
                          </TableCell>
                          <TableCell className='text-center'>
                            {res.chulNo != null && res.chulNo !== '' ? (
                              <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-700 text-white text-xs font-bold'>
                                {res.chulNo}
                              </span>
                            ) : <span className='text-text-tertiary text-xs'>-</span>}
                          </TableCell>
                          <TableCell className='font-medium text-foreground whitespace-nowrap'>
                            {res.hrNo ? (
                              <Link
                                href={routes.horses.detail(res.hrNo)}
                                className='hover:text-primary hover:underline'
                              >
                                {res.hrName}
                              </Link>
                            ) : (
                              res.hrName
                            )}
                          </TableCell>
                          <TableCell className='text-center text-text-secondary text-sm whitespace-nowrap'>{row.sex ?? '-'}</TableCell>
                          <TableCell className='text-center text-text-secondary text-sm whitespace-nowrap'>{row.age ?? '-'}</TableCell>
                          <TableCell className='text-right text-sm whitespace-nowrap tabular-nums'>{row.wgBudam != null ? `${row.wgBudam}` : '-'}</TableCell>
                          <TableCell className='text-text-secondary whitespace-nowrap'>
                            {(res as { jkNo?: string }).jkNo && res.jkName ? (
                              <Link
                                href={routes.jockeys.detail((res as { jkNo: string }).jkNo)}
                                className='hover:text-primary hover:underline'
                              >
                                {res.jkName}
                              </Link>
                            ) : (
                              res.jkName ?? '-'
                            )}
                          </TableCell>
                          <TableCell className='text-text-secondary text-sm whitespace-nowrap'>
                            {row.trName ? (
                              <Link
                                href={routes.trainers.detail(row.trName)}
                                className='hover:text-primary hover:underline'
                              >
                                {row.trName}
                              </Link>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className='text-text-secondary text-sm whitespace-nowrap'>{row.owName ?? '-'}</TableCell>
                          <TableCell className='text-right text-text-tertiary font-mono text-xs whitespace-nowrap tabular-nums'>
                            {record}
                          </TableCell>
                          <TableCell className='text-right text-text-secondary text-xs whitespace-nowrap tabular-nums'>{row.wgHr ?? '-'}</TableCell>
                          <TableCell className='text-right text-sm whitespace-nowrap tabular-nums'>
                            {row.winOdds != null && !displayOrdType ? (
                              <Tooltip content='단승식 배당률' inline>
                                <span className='cursor-help'>{row.winOdds}</span>
                              </Tooltip>
                            ) : '-'}
                          </TableCell>
                          <TableCell className='text-right text-sm whitespace-nowrap tabular-nums'>
                            {row.plcOdds != null && !displayOrdType ? (
                              <Tooltip content='연승식 배당률' inline>
                                <span className='cursor-help'>{row.plcOdds}</span>
                              </Tooltip>
                            ) : '-'}
                          </TableCell>
                          <TableCell className='text-text-tertiary text-xs whitespace-nowrap'>{row.hrTool ?? '-'}</TableCell>
                          <TableCell className='text-center'>
                            {ordTypeLabel ? (
                              <Badge
                                variant={
                                  displayOrdType === 'FALL'
                                    ? 'warning'
                                    : displayOrdType === 'DQ'
                                      ? 'error'
                                      : 'muted'
                                }
                                size='sm'
                              >
                                <span className='inline-flex items-center gap-0.5'>
                                  {ordTypeLabel}
                                  <Tooltip content={remarkTooltip} inline hideTriggerIcon>
                                    <span className='cursor-help inline-flex opacity-80 hover:opacity-100'>
                                      <Icon name='AlertCircle' size={12} />
                                    </span>
                                  </Tooltip>
                                </span>
                              </Badge>
                            ) : (
                              <span className='text-text-tertiary'>-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* 승식별 배당률 */}
              {Array.isArray(dividends) && dividends.length > 0 && (() => {
                type D = { poolName?: string; pool?: string; chulNo?: string; chulNo2?: string; chulNo3?: string; odds?: number };
                const ORDERED_POOLS = new Set(['쌍승식', '삼쌍승식']);
                const POOL_BADGE: Record<string, string> = {
                  '단승식': 'bg-emerald-600', '연승식': 'bg-teal-600', '복승식': 'bg-blue-600',
                  '쌍승식': 'bg-violet-600', '복연승식': 'bg-amber-600', '삼복승식': 'bg-orange-600', '삼쌍승식': 'bg-rose-600',
                };
                const POOL_ODDS: Record<string, string> = {
                  '단승식': 'text-emerald-700', '연승식': 'text-teal-700', '복승식': 'text-blue-700',
                  '쌍승식': 'text-violet-700', '복연승식': 'text-amber-700', '삼복승식': 'text-orange-700', '삼쌍승식': 'text-rose-700',
                };
                const byPool = (dividends as D[]).reduce((acc, d) => {
                  const key = d.poolName ?? d.pool ?? '배당';
                  if (!acc[key]) acc[key] = [];
                  const nums = [d.chulNo, d.chulNo2, d.chulNo3].filter(Boolean) as string[];
                  acc[key].push({ nums, odds: d.odds });
                  return acc;
                }, {} as Record<string, { nums: string[]; odds?: number }[]>);
                const poolOrder = ['단승식', '연승식', '복승식', '쌍승식', '복연승식', '삼복승식', '삼쌍승식'];
                const ordered = poolOrder.filter((p) => byPool[p]?.length).concat(Object.keys(byPool).filter((k) => !poolOrder.includes(k) && byPool[k]?.length));
                const nameByChulNo: Record<string, string> = {};
                for (const e of displayEntries) {
                  if (e.chulNo && e.hrName) nameByChulNo[e.chulNo] = e.hrName;
                }
                return (
                  <div className='rounded-xl border border-border overflow-hidden mt-4'>
                    <div className='bg-[#1c1917] px-3 py-2 flex items-center justify-between'>
                      <span className='text-xs font-semibold text-white'>승식별 배당률</span>
                      <span className='text-stone-500 text-[11px]'>파리뮤추얼 · 경주 확정 후 적용</span>
                    </div>
                    <Table className='w-full border-collapse text-xs [&_th]:py-3 [&_td]:py-2.5'>
                      <TableBody>
                        {ordered.map((poolName, pi) => {
                          const items = byPool[poolName];
                          if (!items?.length) return null;
                          const badgeCls = POOL_BADGE[poolName] ?? 'bg-stone-600';
                          const oddsCls = POOL_ODDS[poolName] ?? 'text-stone-700';
                          const isOrdered = ORDERED_POOLS.has(poolName);
                          return (
                            <TableRow key={poolName} className={pi % 2 === 1 ? 'bg-stone-50/60' : 'bg-white'}>
                              <TableCell className='pl-3 pr-2 py-2 align-top w-[72px]'>
                                <span className={`inline-block text-[11px] font-bold px-1.5 py-0.5 rounded text-white ${badgeCls}`}>{poolName}</span>
                              </TableCell>
                              <TableCell className='pr-3 py-2'>
                                <div className='flex flex-wrap gap-x-3 gap-y-1'>
                                  {items.map(({ nums, odds }, ci) => (
                                    <span key={ci} className='inline-flex items-center gap-0.5'>
                                      {nums.map((n, ni) => (
                                        <span key={ni} className='inline-flex items-center gap-0.5'>
                                          <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-800 text-white font-bold' style={{ fontSize: '11px' }}>{n}</span>
                                          {nameByChulNo[n] && <span className='text-foreground font-medium'>{nameByChulNo[n]}</span>}
                                          {ni < nums.length - 1 && <span className='text-stone-400 mx-0.5'>{isOrdered ? '→' : '-'}</span>}
                                        </span>
                                      ))}
                                      {odds != null && <span className={`ml-1 font-bold ${oddsCls}`}>{odds}배</span>}
                                    </span>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })()}
              <p className='mt-3 text-text-tertiary text-xs'>
                제재·심판 리포트·구간별 통과순위 등 상세 성적은{' '}
                <a
                  href='https://race.kra.co.kr/raceScore/ScoretableDetailList.do'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:underline'
                >
                  KRA 경주성적
                </a>
                에서 확인하세요.
              </p>

              {/* Prediction vs Result: rank-by-rank match (completed race + prediction + results) */}
              {isRaceCompleted &&
                hasResults &&
                displayPrediction?.scores?.horseScores &&
                displayPrediction.scores.horseScores.length > 0 && (() => {
                  const sorted = [...displayPrediction.scores.horseScores].sort(
                    (a, b) => (b.score ?? 0) - (a.score ?? 0),
                  );
                  const predictedTop = sorted.slice(0, 3).map((p, i) => ({
                    rank: i + 1,
                    hrNo: String(p.hrNo ?? p.chulNo ?? '').trim(),
                    hrName: (p.hrName ?? p.horseName ?? '').trim() || '-',
                    chulNo: p.chulNo,
                  }));
                  const normalResults = effectiveResults.filter((res) => {
                    const ord = parseInt(String(res.ord ?? ''), 10);
                    const ok = ord >= 1 && ord <= 3 && (!res.ordType || res.ordType === 'NORMAL');
                    return ok;
                  });
                  const actualTop = normalResults
                    .sort((a, b) => parseInt(String(a.ord), 10) - parseInt(String(b.ord), 10))
                    .slice(0, 3)
                    .map((res) => {
                      const entry = race?.entries?.find((e) => String(e.hrNo) === String(res.hrNo));
                      return {
                        ord: parseInt(String(res.ord), 10),
                        hrNo: String(res.hrNo ?? '').trim(),
                        hrName: (res.hrName ?? '').trim() || '-',
                        chulNo: entry?.chulNo,
                        ordType: res.ordType,
                      };
                    });
                  return (
                    <div className='mt-4'>
                      <PredictionResultComparison
                        predictedTop={predictedTop}
                        actualTop={actualTop}
                        horseLink={routes.horses.detail}
                      />
                    </div>
                  );
                })()}
              </>
              )}
            </section>
          )}

          {/* ── AI Replay / Review for completed races ── */}
          {isRaceCompleted && displayPrediction?.scores?.horseScores && displayPrediction.scores.horseScores.length > 0 && (
            <section>
              <SectionTitle
                title='AI 예측 복기'
                icon='Sparkles'
                badge='학습'
                className='mb-2'
              />
              <div className='space-y-3'>
                {/* AI's prediction summary for this completed race */}
                <div className='rounded-xl border border-border bg-background-elevated p-3.5 shadow-sm'>
                  <div className='flex items-center gap-2 mb-2'>
                    <div className='w-1 h-4 rounded-full bg-primary' />
                    <p className='text-sm text-foreground font-semibold'>
                      AI가 예측한 순위
                    </p>
                  </div>
                  <HorseScoresBarChart
                    horseScores={displayPrediction.scores.horseScores}
                  />
                </div>

                {/* AI reasoning for completed race */}
                {displayPrediction.scores.horseScores.some((h) => h.reason) && (
                  <div className='rounded-xl border border-border bg-stone-50/50 p-3.5'>
                    <p className='text-xs font-semibold text-text-secondary mb-2'>AI가 주목한 포인트</p>
                    <div className='space-y-2'>
                      {displayPrediction.scores.horseScores.slice(0, 3).map((h, i) => {
                        if (!h.reason) return null;
                        const name = h.hrName ?? h.horseName ?? '-';
                        return (
                          <div key={i} className='flex items-start gap-2 text-xs'>
                            <span className='shrink-0 font-bold text-text-secondary tabular-nums'>{i + 1}위</span>
                            <div>
                              <span className='font-medium text-foreground'>{name}</span>
                              <span className='text-text-secondary'> — {h.reason}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Full AI analysis text */}
                {displayPrediction.analysis && (
                  <div className='rounded-xl border border-border bg-stone-50/50 p-3.5'>
                    <p className='text-xs font-semibold text-text-secondary mb-1.5'>AI 상세 분석 (경주 전)</p>
                    <p className='text-text-secondary text-sm leading-relaxed whitespace-pre-wrap'>
                      {displayPrediction.analysis}
                    </p>
                  </div>
                )}

                {/* Post-race Gemini summary */}
                {displayPrediction.postRaceSummary && (
                  <div className='rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5'>
                    <p className='text-xs font-semibold text-primary mb-1.5'>경주 후 AI 분석</p>
                    <p className='text-foreground text-sm leading-relaxed whitespace-pre-wrap'>
                      {displayPrediction.postRaceSummary}
                    </p>
                  </div>
                )}

                {/* Learning tip */}
                <div className='rounded-lg bg-stone-50/60 border border-border/30 px-3.5 py-3'>
                  <div className='flex items-start gap-2'>
                    <Icon name='AlertCircle' size={14} className='text-text-tertiary shrink-0 mt-0.5' />
                    <p className='text-[11px] text-text-tertiary leading-relaxed'>
                      복기를 통해 AI의 분석 근거와 실제 결과를 비교하면 경마 분석 감각을 키울 수 있습니다.
                      AI가 놓친 요소(당일 컨디션, 주로 상태 등)를 함께 생각해보세요.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── Entries (same section/table style as 경주 결과) ── */}
          {showEntriesSection && (
            <section>
              <span data-tour="race-detail-entries" className='block h-0' />
              <SectionTitle
                title='출전마'
                icon='ClipboardList'
                badge={displayEntries.length ? `${displayEntries.length}두` : undefined}
                className='mb-2'
              />
              {entries.length > 0 ? (
                <HorseEntryTable
                  entries={entries}
                  raceId={typeof id === 'string' ? id : undefined}
                  oddsMap={oddsMap}
                />
              ) : displayEntries.length > 0 ? (
                <div className='rounded-xl border border-border overflow-hidden shadow-sm'>
                  <Table className='w-full min-w-[200px] [&_th]:py-3 [&_td]:py-2.5'>
                    <TableHeader>
                      <TableRow className='hover:bg-transparent bg-stone-50 border-b border-border text-xs text-text-secondary'>
                        <TableHead className='text-left min-w-[90px]'>마명</TableHead>
                        <TableHead className='text-left w-20'>기수</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayEntries.map((e, i) => (
                        <TableRow key={e.hrNo ?? i}>
                          <TableCell className='font-medium text-foreground'>{e.hrName}</TableCell>
                          <TableCell className='text-text-secondary'>{e.jkName ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className='rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center'>
                  <p className='text-text-secondary text-sm'>출전마 정보가 없습니다.</p>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => refetchRace()}
                    className='mt-3'
                  >
                    다시 시도
                  </Button>
                </div>
              )}
              {/* Odds explanation panel — shown for completed races */}
              {isRaceCompleted && (
                <div className='mt-3'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => setOddsExplainOpen((v) => !v)}
                    className='text-xs text-text-tertiary hover:text-text-secondary px-0'
                  >
                    <Icon name='AlertCircle' size={13} />
                    배당률이란 무엇인가요?
                    <Icon name={oddsExplainOpen ? 'Minus' : 'Plus'} size={12} />
                  </Button>
                  {oddsExplainOpen && (
                    <div className='mt-2 rounded-xl border border-border bg-stone-50 p-4 text-xs text-text-secondary space-y-3'>
                      <div>
                        <p className='font-semibold text-foreground mb-1'>배당률 결정 방식 — 파리뮤추얼(Pari-mutuel)</p>
                        <p>경마 배당률은 고정된 것이 아닙니다. 투표자들이 각 말에 투표한 금액의 합계로 자동 결정됩니다. 마감 전까지 실시간으로 바뀌며, 경주 확정 후 최종 배당률이 확정됩니다.</p>
                      </div>
                      <div className='space-y-1.5'>
                        <div className='flex gap-2'>
                          <span className='shrink-0 inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white'>단승식</span>
                          <span>1위 말을 적중시키는 방식. 배당 = (전체 판매금 × 공제 후) ÷ 해당 말 투표금. 인기마일수록 투표가 몰려 배당이 낮아집니다.</span>
                        </div>
                        <div className='flex gap-2'>
                          <span className='shrink-0 inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-teal-600 text-white'>연승식</span>
                          <span>3위 내에 드는 말을 적중시키는 방식. 적중 확률이 높은 만큼 단승식보다 배당이 낮습니다.</span>
                        </div>
                      </div>
                      <div className='pt-1 border-t border-border text-text-tertiary'>
                        <p>공제율(약 20~25%)은 마사회 운영비·세금 등으로 차감됩니다. 표시된 배당률은 KRA 공시 기준 최종 지급 배수입니다.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ── Jockey·horse integrated analysis (same section/table style as 경주 결과·출전마) ── */}
          <section>
            <SectionTitle
              title='기수·말 통합 분석'
              icon='BarChart2'
              badge={jockeyAnalysis?.entriesWithScores?.length ? `${jockeyAnalysis.entriesWithScores.length}두` : undefined}
              className='mb-2'
            />
            {jockeyLoading ? (
              <div className='rounded-xl border border-border overflow-hidden shadow-sm bg-white'>
                <div className='py-6 flex justify-center'>
                  <LoadingSpinner size={22} label='분석 중...' />
                </div>
              </div>
            ) : jockeyError ? (
              <div className='rounded-xl border border-border bg-muted/20 px-4 py-6 text-center'>
                <p className='text-text-secondary text-sm'>분석 정보를 확인할 수 없습니다.</p>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => refetchJockey()}
                  className='mt-2'
                >
                  다시 시도
                </Button>
              </div>
            ) : jockeyAnalysis?.entriesWithScores?.length ? (
              <div className='space-y-3'>
                {jockeyAnalysis.weightRatio && (
                  <p className='text-text-tertiary text-xs'>
                    반영 비율: 말 {Math.round(jockeyAnalysis.weightRatio.horse * 100)}% · 기수{' '}
                    {Math.round(jockeyAnalysis.weightRatio.jockey * 100)}% (참고용)
                  </p>
                )}
                {/* Mobile: card list */}
                <div className='block sm:hidden divide-y divide-border rounded-xl border border-border overflow-hidden'>
                  {jockeyAnalysis.entriesWithScores.slice(0, 14).map(
                    (
                      e: {
                        hrNo: string;
                        hrName: string;
                        jkName?: string;
                        chulNo?: string;
                        horseScore?: number;
                        jockeyScore?: number;
                        combinedScore?: number;
                      },
                      i,
                    ) => (
                      <div key={e.hrNo} className='flex items-center gap-2.5 py-2.5 px-3 bg-card'>
                        <PredictionSymbol type={scoreToSymbol(i + 1)} size='sm' />
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-1.5'>
                            {e.chulNo != null && (
                              <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-800 text-white text-[11px] font-bold shrink-0'>
                                {e.chulNo}
                              </span>
                            )}
                            <span className='text-sm font-medium text-foreground'>{e.hrName ?? '-'}</span>
                          </div>
                          {e.jkName && <p className='text-xs text-text-secondary mt-0.5'>{e.jkName}</p>}
                        </div>
                        <div className='text-right shrink-0'>
                          <p className={`text-sm font-bold tabular-nums ${i === 0 ? 'text-foreground' : i === 1 ? 'text-stone-600' : i === 2 ? 'text-stone-500' : 'text-text-tertiary'}`}>
                            {e.combinedScore != null ? Math.round(e.combinedScore) : '-'}
                          </p>
                          <p className='text-[11px] text-text-tertiary tabular-nums'>
                            말{e.horseScore != null ? Math.round(e.horseScore) : '-'} · 기{e.jockeyScore != null ? Math.round(e.jockeyScore) : '-'}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
                {/* Desktop: table */}
                <div className='hidden sm:block rounded-xl border border-border overflow-hidden shadow-sm overflow-x-auto'>
                  <Table className='w-full min-w-[320px] [&_th]:py-3 [&_td]:py-2.5'>
                    <TableHeader>
                      <TableRow className='hover:bg-transparent bg-stone-50 border-b border-border text-xs text-text-secondary'>
                        <TableHead className='text-center w-10'>순위</TableHead>
                        <TableHead className='text-left min-w-[90px]'>마명</TableHead>
                        <TableHead className='text-left w-20'>기수</TableHead>
                        <TableHead className='text-right w-14'>말점수</TableHead>
                        <TableHead className='text-right w-14'>기수점수</TableHead>
                        <TableHead className='text-right w-14'>통합</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jockeyAnalysis.entriesWithScores
                        .slice(0, 14)
                        .map(
                          (
                            e: {
                              hrNo: string;
                              hrName: string;
                              jkName?: string;
                              chulNo?: string;
                              horseScore?: number;
                              jockeyScore?: number;
                              combinedScore?: number;
                            },
                            i
                          ) => {
                            const rankCls =
                              i === 0
                                ? 'text-foreground font-bold'
                                : i === 1
                                  ? 'text-stone-600 font-bold'
                                  : i === 2
                                    ? 'text-stone-500 font-bold'
                                    : 'text-text-tertiary';
                            return (
                              <TableRow
                                key={e.hrNo}
                              >
                                <TableCell className='text-center'>
                                  <PredictionSymbol type={scoreToSymbol(i + 1)} size='sm' />
                                </TableCell>
                                <TableCell className='font-medium text-foreground'>
                                  <span className='inline-flex items-center gap-1.5 min-w-0'>
                                    {e.chulNo != null && (
                                      <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-800 text-white text-[11px] font-bold shrink-0'>
                                        {e.chulNo}
                                      </span>
                                    )}
                                    <span className='whitespace-nowrap'>{e.hrName ?? '-'}</span>
                                  </span>
                                </TableCell>
                                <TableCell className='text-text-secondary whitespace-nowrap'>
                                  {e.jkName ?? '-'}
                                </TableCell>
                                <TableCell className='text-right text-text-tertiary font-mono text-xs tabular-nums'>
                                  {e.horseScore != null ? Math.round(e.horseScore) : '-'}
                                </TableCell>
                                <TableCell className='text-right text-text-tertiary font-mono text-xs tabular-nums'>
                                  {e.jockeyScore != null ? Math.round(e.jockeyScore) : '-'}
                                </TableCell>
                                <TableCell className={`text-right font-bold font-mono text-xs tabular-nums ${rankCls}`}>
                                  {e.combinedScore != null ? Math.round(e.combinedScore) : '-'}
                                </TableCell>
                              </TableRow>
                            );
                          },
                        )}
                    </TableBody>
                  </Table>
                </div>
                {jockeyAnalysis.topPickByJockey && (
                  <div className='p-3 rounded-xl border border-border bg-stone-50/50'>
                    <p className='text-xs text-text-secondary font-semibold mb-1'>
                      기수 점수 1위 추천
                    </p>
                    <p className='text-foreground font-medium text-sm'>
                      {jockeyAnalysis.topPickByJockey.hrName}{' '}
                      <span className='text-text-secondary font-normal'>
                        · {jockeyAnalysis.topPickByJockey.jkName}
                      </span>
                    </p>
                    {jockeyAnalysis.topPickByJockey.jockeyScore != null && (
                      <p className='text-text-tertiary text-xs mt-0.5'>
                        기수 점수 {Math.round(jockeyAnalysis.topPickByJockey.jockeyScore)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className='rounded-xl border border-border bg-muted/20 px-4 py-6 text-center'>
                <p className='text-text-secondary text-sm'>분석 결과가 없습니다.</p>
              </div>
            )}
          </section>
        </div>

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
  const [showGuide, setShowGuide] = useState(false);

  const horseScores = prediction?.scores?.horseScores ?? [];
  const maxWinProb =
    horseScores.length > 0
      ? Math.max(0, ...horseScores.map((h) => h.winProb ?? 0))
      : 0;

  /* Top 3 horse names for confidence summary */
  const top3Names = horseScores.slice(0, 3).map((h) => h.hrName ?? h.horseName ?? '-');
  const topScore = horseScores[0]?.score ?? 0;
  const secondScore = horseScores[1]?.score ?? 0;
  const scoreDiff = topScore - secondScore;

  return (
    <div className='space-y-4'>
      {/* Prediction confidence card — explains the prediction at a glance */}
      {maxWinProb > 0 && (
        <div className={`rounded-xl border p-3.5 ${
          maxWinProb >= 70
            ? 'border-emerald-200 bg-emerald-50/50'
            : maxWinProb >= 50
              ? 'border-amber-200 bg-amber-50/40'
              : 'border-stone-200 bg-stone-50/40'
        }`}>
          <div className='flex items-start gap-3'>
            {/* Confidence gauge */}
            <div className='shrink-0 relative w-12 h-12'>
              <svg viewBox='0 0 36 36' className='w-12 h-12 -rotate-90'>
                <circle cx='18' cy='18' r='15.5' fill='none' strokeWidth='3' className='stroke-stone-200/60' />
                <circle
                  cx='18' cy='18' r='15.5' fill='none' strokeWidth='3'
                  strokeLinecap='round'
                  strokeDasharray={`${maxWinProb} ${100 - maxWinProb}`}
                  className={maxWinProb >= 70 ? 'stroke-emerald-500' : maxWinProb >= 50 ? 'stroke-amber-500' : 'stroke-stone-400'}
                />
              </svg>
              <span className='absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums'>
                {Math.round(maxWinProb)}%
              </span>
            </div>

            {/* Confidence description */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-1.5 mb-1'>
                <span className={`text-sm font-bold ${
                  maxWinProb >= 70 ? 'text-emerald-800' : maxWinProb >= 50 ? 'text-amber-800' : 'text-stone-700'
                }`}>
                  {maxWinProb >= 70 ? '예측 신뢰도 높음' : maxWinProb >= 50 ? '예측 신뢰도 보통' : '예측 신뢰도 낮음 (혼전)'}
                </span>
              </div>
              <p className='text-xs text-text-secondary leading-relaxed'>
                {maxWinProb >= 70 ? (
                  <>
                    <span className='font-medium text-foreground'>{top3Names[0]}</span>
                    이(가) {Math.round(maxWinProb)}% 확률로 가장 유력합니다.
                    {scoreDiff >= 15 && ' 2위와 점수 차이가 커 독주 가능성이 높습니다.'}
                  </>
                ) : maxWinProb >= 50 ? (
                  <>
                    <span className='font-medium text-foreground'>{top3Names[0]}</span>
                    이(가) 가장 유력하지만,
                    {top3Names[1] && <> <span className='font-medium text-foreground'>{top3Names[1]}</span>도 가능성이 있습니다.</>}
                    {' '}상위권 경합이 예상됩니다.
                  </>
                ) : (
                  <>
                    상위 마필 간 점수 차이가 적어 결과를 예측하기 어렵습니다.
                    {top3Names.length >= 3 && (
                      <> {top3Names.slice(0, 3).join(', ')} 모두 가능성이 있습니다.</>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar: prediction count + regenerate */}
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-1.5'>
          {list.length > 1 && <span className='text-text-tertiary text-sm'>({list.length}건)</span>}
        </div>
        {!isRaceCompleted && availableTickets > 0 && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => {
              trackCTA('PREDICTION_REGENERATE', raceId);
              useTicketMutation.mutate({ raceId, regenerate: true });
            }}
            disabled={useTicketMutation.isPending || isCoolingDown}
            className='shrink-0'
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
          </Button>
        )}
      </div>

      {/* Prediction history tabs (2 or more) */}
      {list.length > 1 && (
        <div className='flex gap-1.5 overflow-x-auto pb-1'>
          {list.map((p, i) => {
            const pid = Number(p.id ?? i);
            const isActive =
              pid === (selectedPredictionId ?? Number(list[0]?.id));
            const createdAt = p.createdAt;
            let timeStr = '';
            try {
              if (createdAt) timeStr = formatTime(createdAt);
            } catch {
              /* */
            }
            return (
              <Button
                key={pid}
                variant={isActive ? 'default' : 'outline'}
                size='sm'
                onClick={() => setSelectedPredictionId(pid)}
                className='shrink-0'
              >
                {i === 0 ? '최신' : `${list.length - i}번째`}
                {timeStr && <span className='ml-1 opacity-75'>{timeStr}</span>}
              </Button>
            );
          })}
        </div>
      )}

      {useTicketMutation.isError && (
        <p className='text-error text-sm'>{getErrorMessage(useTicketMutation.error)}</p>
      )}

      {prediction?.scores?.horseScores?.length ? (
        <>
          {/* Bet type predictions */}
          {(prediction.scores?.betTypePredictions || prediction.scores?.horseScores?.length) &&
            entries.length > 0 && (
              <BetTypePredictionsSection
                betTypePredictions={prediction.scores.betTypePredictions}
                horseScores={prediction.scores.horseScores}
                entries={entries}
              />
            )}

          {/* Horse score bar chart (single unified view — replaces redundant ranking list) */}
          <div>
            <div className='flex items-center gap-2 mb-2'>
              <div className='w-1 h-4 rounded-full bg-primary' />
              <p className='text-sm text-foreground font-semibold'>
                AI 추천 순위
              </p>
              <span className='text-[11px] text-text-tertiary'>(참고용)</span>
            </div>
            <HorseScoresBarChart
              horseScores={prediction.scores!.horseScores!}
              className='rounded-xl border border-border bg-background-elevated p-3.5 shadow-sm'
            />
          </div>

          {/* Top 3 reason cards — shows WHY each horse is ranked */}
          {horseScores.some((h) => h.reason) && (
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <div className='w-1 h-4 rounded-full bg-accent' />
                <p className='text-sm text-foreground font-semibold'>
                  AI 추천 이유
                </p>
              </div>
              <div className='space-y-2'>
                {horseScores.slice(0, 3).map((h, i) => {
                  if (!h.reason) return null;
                  const rank = i + 1;
                  const name = h.hrName ?? h.horseName ?? '-';
                  return (
                    <div key={i} className='flex items-start gap-2.5 p-3 rounded-lg bg-stone-50/80 border border-border/50'>
                      <PredictionSymbol type={scoreToSymbol(rank)} size='sm' />
                      <div className='flex-1 min-w-0'>
                        <span className='text-sm font-medium text-foreground'>
                          {h.chulNo != null && <span className='text-text-tertiary mr-1'>{h.chulNo}번</span>}
                          {name}
                        </span>
                        <p className='text-xs text-text-secondary mt-0.5 leading-relaxed'>{h.reason}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI analysis */}
          {prediction.analysis && (
            <div>
              <div className='flex items-center gap-2 mb-1.5'>
                <div className='w-1 h-4 rounded-full bg-teal-500' />
                <p className='text-sm text-foreground font-semibold'>AI 상세 분석</p>
              </div>
              <div className='p-3 rounded-xl bg-stone-50 border border-stone-200'>
                <p className='text-text-secondary text-sm leading-relaxed whitespace-pre-wrap'>
                  {prediction.analysis}
                </p>
              </div>
            </div>
          )}

          {/* Post-race summary (Gemini-generated after results) */}
          {prediction.postRaceSummary && (
            <div className='mt-4'>
              <div className='flex items-center gap-2 mb-1.5'>
                <div className='w-1 h-4 rounded-full bg-blue-500' />
                <p className='text-sm text-foreground font-semibold'>경주 후 분석</p>
              </div>
              <div className='p-3 rounded-xl bg-primary-muted border border-border'>
                <p className='text-foreground text-sm leading-relaxed whitespace-pre-wrap'>
                  {prediction.postRaceSummary}
                </p>
              </div>
            </div>
          )}

          {/* Score interpretation guide — collapsible */}
          <div className='border-t border-border/50 pt-3'>
            <button
              type='button'
              onClick={() => setShowGuide(!showGuide)}
              className='flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors'
            >
              <Icon name='HelpCircle' size={14} />
              <span className='underline decoration-dotted underline-offset-2'>
                점수 읽는 법
              </span>
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${showGuide ? 'rotate-180' : ''}`}
                fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='m19 9-7 7-7-7' />
              </svg>
            </button>
            {showGuide && (
              <div className='mt-2.5 p-3 rounded-lg bg-stone-50/80 border border-border/40 text-xs text-text-secondary space-y-2 leading-relaxed'>
                <p>
                  <span className='font-semibold text-foreground'>AI 종합 점수 (0~100)</span>
                  {' — '}레이팅, 폼/기세, 기수 능력, 컨디션, 거리 적합도 등 <span className='font-medium'>15가지 분석 요소</span>를 종합한 점수입니다.
                </p>
                <p>
                  <span className='font-semibold text-foreground'>예측 신뢰도</span>
                  {' — '}1위 예상마의 승리 확률입니다. 높을수록 AI가 해당 경주의 결과를 확신합니다.
                  낮으면 여러 말이 비슷한 실력이라 변수가 많은 경주입니다.
                </p>
                <p>
                  <span className='font-semibold text-foreground'>세부 점수</span>
                  {' — '}막대 차트에서 말 이름을 탭하면 각 요소별(레이팅, 폼, 컨디션 등) 세부 점수를 확인할 수 있습니다.
                  강점은 <span className='text-emerald-700 font-medium'>초록색</span>, 약점은 <span className='text-stone-400 font-medium'>회색</span>으로 표시됩니다.
                </p>
              </div>
            )}
          </div>

          {/* Simulator shortcut */}
          {!isRaceCompleted && (
            <div className='rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5'>
              <div className='flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='text-sm font-semibold text-foreground'>내가 직접 분석해보기</p>
                  <p className='text-xs text-text-secondary mt-0.5'>
                    분석 요소별 가중치를 조절해서 나만의 예측을 만들어보세요
                  </p>
                </div>
                <Link href={routes.races.simulator(raceId)} className='shrink-0'>
                  <Button variant='outline' size='sm'>
                    <Icon name='Target' size={14} />
                    시뮬레이터
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* AI limitation disclaimer */}
          <div className='rounded-lg bg-stone-50/60 border border-border/30 px-3.5 py-3'>
            <div className='flex items-start gap-2'>
              <Icon name='AlertCircle' size={14} className='text-text-tertiary shrink-0 mt-0.5' />
              <div>
                <p className='text-[11px] text-text-tertiary leading-relaxed'>
                  AI 예측은 과거 경주 데이터를 기반으로 한 통계적 분석이며, 경주 당일의 마체중 변화, 기수·경주마 컨디션, 날씨, 주로 상태 등은 사전에 완벽히 반영할 수 없습니다. 참고 자료로만 활용해 주세요.
                </p>
                <Link href={routes.about.ai} className='text-[11px] text-primary hover:underline mt-1 inline-block'>
                  AI 분석 시스템 자세히 보기 &rarr;
                </Link>
              </div>
            </div>
          </div>
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
            <p className='text-text-secondary text-sm mb-3'>개별 예측권 {availableTickets}장 보유</p>
            <Button
              onClick={() => {
                trackCTA('PREDICTION_TICKET_USE', raceId);
                useTicketMutation.mutate({ raceId });
              }}
              disabled={useTicketMutation.isPending}
              className='w-full sm:w-auto px-5 py-2.5'
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
            </Button>
            {useTicketMutation.isError && (
              <p className='text-error mt-3'>{getErrorMessage(useTicketMutation.error)}</p>
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
