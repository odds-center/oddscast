import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { GetServerSideProps } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { serverGet } from '@/lib/api/serverFetch';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import { Badge, SectionTitle } from '@/components/ui';
import Tooltip from '@/components/ui/Tooltip';
import BackLink from '@/components/page/BackLink';
import LoadingSpinner from '@/components/LoadingSpinner';
import RaceHeaderCard, { getGateBgColor } from '@/components/race/RaceHeaderCard';
import HorseEntryTable from '@/components/race/HorseEntryTable';
import PredictionSymbol, { scoreToSymbol } from '@/components/race/PredictionSymbol';
import RaceApi from '@/lib/api/raceApi';
import PicksApi, { PICK_TYPE_HORSE_COUNTS } from '@/lib/api/picksApi';
import HorsePickPanel from '@/components/HorsePickPanel';
import BetTypePredictionsSection from '@/components/predictions/BetTypePredictionsSection';
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
import { formatTime, isPastRaceDateTime } from '@/lib/utils/format';

/** ordType → 비고 라벨 (낙마/실격/기권). NORMAL·null이면 빈 문자열 */
function formatOrdTypeLabel(ordType: string | null | undefined): string {
  if (!ordType || ordType === 'NORMAL') return '';
  const map: Record<string, string> = { FALL: '낙마', DQ: '실격', WITHDRAWN: '기권' };
  return map[ordType] ?? '';
}

/** Format race time in seconds as M:SS.s (e.g. 75.9 → "1:15.9", 300 → "5:00.0") */
function formatRaceTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toFixed(1).padStart(3, '0')}`;
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
    placeholderData: keepPreviousData,
  });

  const raceStatus =
    (race as { status?: string; raceStatus?: string })?.status ??
    (race as { status?: string; raceStatus?: string })?.raceStatus;
  const rcDate = (race as { rcDate?: string })?.rcDate;
  const stTime = (race as { stTime?: string })?.stTime;
  const isRaceCompleted =
    raceStatus === 'COMPLETED' || (!!rcDate && isPastRaceDateTime(rcDate, stTime));

  const { data: myPick } = useQuery({
    queryKey: ['picks', 'race', id],
    queryFn: () => PicksApi.getByRace(id as string),
    enabled: !!id && isLoggedIn && CONFIG.picksEnabled,
    placeholderData: keepPreviousData,
  });

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

  const hasUsedTicketForRace = !!ticketHistory?.tickets?.some(
    (t) => String(t.raceId) === String(id) && t.status === 'USED',
  );

  const { data: fullPredictionData } = useQuery({
    queryKey: ['prediction', 'full', id],
    queryFn: () => PredictionApi.getByRaceId(id as string),
    enabled: !!id && (isRaceCompleted || (isLoggedIn && !!hasUsedTicketForRace)),
    placeholderData: keepPreviousData,
  });

  const { data: predictionHistory } = useQuery({
    queryKey: ['prediction', 'history', id],
    queryFn: () => PredictionApi.getHistoryByRaceId(id as string),
    enabled: !!id && (isRaceCompleted || (isLoggedIn && !!hasUsedTicketForRace)),
    placeholderData: keepPreviousData,
  });

  const [selectedPredictionId, setSelectedPredictionId] = useState<number | null>(null);

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

  // Prefer dedicated GET /races/:id/results; fallback to results embedded in GET /races/:id (RACE_INCLUDE_FULL)
  const resultsEmbedded = (r.results ?? []) as Array<{
    ord?: string | number;
    chulNo?: string;
    hrNo?: string;
    hrName?: string;
    jkName?: string;
    diffUnit?: string | null;
    rcTime?: string | null;
    ordType?: string | null;
    winOdds?: number;
    plcOdds?: number;
    [k: string]: unknown;
  }>;
  const effectiveResults =
    (raceResults?.length ?? 0) > 0
      ? (raceResults ?? [])
      : Array.isArray(resultsEmbedded) && resultsEmbedded.length > 0
        ? resultsEmbedded
        : [];
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
            budam={(r as { budam?: string }).budam ?? (entries[0] as { budam?: string } | undefined)?.budam}
            rcPrize={(r as { rcPrize?: number }).rcPrize}
            weather={(r as { weather?: string }).weather}
            track={(r as { track?: string }).track}
          />

          {/* ── AI prediction (above the fold so ticket use CTA is visible) ── */}
          <section>
            <SectionTitle
              title='AI 예측'
              icon='Target'
              badge={
                !isRaceCompleted && isLoggedIn && availableTickets > 0
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
            ) : isRaceCompleted ? (
              <div className='rounded-md border border-stone-200 bg-stone-50 p-4 text-center flex flex-col items-center'>
                <div className='w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-2'>
                  <Icon name='Target' size={20} className='text-stone-400' />
                </div>
                <p className='text-text-secondary text-sm mb-3'>이 경주에 대한 AI 예측이 없습니다.</p>
                <p className='text-text-tertiary text-xs mb-3'>예측권으로 과거 경주 예측을 생성해 볼 수 있습니다.</p>
                {isLoggedIn && availableTickets > 0 && (
                  <button
                    type='button'
                    onClick={() => {
                      trackCTA('PREDICTION_TICKET_USE', id as string);
                      useTicketMutation.mutate({ raceId: id as string });
                    }}
                    disabled={useTicketMutation.isPending}
                    className='btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2'
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
                {useTicketMutation.isError && (
                  <p className='msg-error text-sm mt-2'>{getErrorMessage(useTicketMutation.error)}</p>
                )}
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

          {/* ── Race results (same section/table style as 출전마) ── */}
          {(isRaceCompleted || hasResults) && (
            <section>
              <SectionTitle
                title='경주 결과'
                icon='Trophy'
                badge={hasResults && effectiveResults.length > 0 ? `${effectiveResults.length}두` : undefined}
                className='mb-2'
              />

              {!hasResults ? (
                <div className='rounded-xl border border-border bg-muted/20 px-4 py-6 text-center text-sm text-text-secondary'>
                  결과를 불러오는 중이거나 아직 반영되지 않았습니다. 잠시 후 새로고침 해 주세요.
                </div>
              ) : (
              <>
              <div className='data-table-wrapper rounded-xl border border-border overflow-hidden shadow-sm overflow-x-auto'>
                <table className='data-table data-table-compact w-full min-w-[640px]'>
                  <thead>
                    <tr className='bg-stone-50 border-b border-border text-xs text-text-secondary'>
                      <th className='cell-center w-10 py-3 font-semibold'>순위</th>
                      <th className='cell-center w-10 py-3 font-semibold'>번호</th>
                      <th className='text-left py-3 min-w-[90px] font-semibold'>마명</th>
                      <th className='cell-center py-3 w-12 font-semibold'>성별</th>
                      <th className='cell-center py-3 w-12 font-semibold'>연령</th>
                      <th className='cell-center py-3 w-12 font-semibold'>중량</th>
                      <th className='text-left py-3 w-20 font-semibold'>기수</th>
                      <th className='text-left py-3 w-20 font-semibold'>조교사</th>
                      <th className='text-left py-3 w-20 font-semibold'>마주</th>
                      <th className='cell-right py-3 font-semibold min-w-[100px]'>
                        <Tooltip
                          content='각 말의 완주 시간(분:초). 2등 이하는 1등과의 초 차이를 +/−로 표시.'
                          inline
                        >
                          <span>기록</span>
                        </Tooltip>
                      </th>
                      <th className='cell-center py-3 w-16 font-semibold'>마체중</th>
                      <th className='cell-center py-3 w-12 font-semibold'>단승</th>
                      <th className='cell-center py-3 w-12 font-semibold'>연승</th>
                      <th className='text-left py-3 w-24 font-semibold'>장구</th>
                      <th className='cell-center py-3 w-16 font-semibold'>
                        <Tooltip
                          content='낙마·실격·기권 등 비정상 결과를 표시합니다.'
                          inline
                        >
                          <span>비고</span>
                        </Tooltip>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
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
                        const no = res.chulNo ?? (res.hrNo && res.hrNo.length <= 2 ? res.hrNo : '-');
                        const rankCls =
                          !displayOrdType && ordN === 1
                            ? 'text-foreground font-bold'
                            : !displayOrdType && ordN === 2
                              ? 'text-stone-600 font-bold'
                              : !displayOrdType && ordN === 3
                                ? 'text-stone-500 font-bold'
                                : 'text-text-tertiary';
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
                            : formatDiffUnit(row.diffUnit ?? '') || '-';
                        const rawOrd = String(res.ord ?? '').trim();
                        const hasReason = rawOrd && !/^\d{1,2}$/.test(rawOrd);
                        const remarkTooltip = hasReason
                          ? rawOrd
                          : displayOrdType === 'DQ'
                            ? '실격 처리 (KRA 기준)'
                            : displayOrdType === 'FALL'
                              ? '낙마'
                              : '기권';
                        const gateNo = parseInt(String(res.chulNo ?? '0'), 10) || 0;
                        const gateBg = getGateBgColor(gateNo);
                        const gateLight = ['#ffffff', '#fde047', '#facc15', '#38bdf8', '#84cc16', '#fde047'].includes(gateBg);
                      return (
                        <tr
                          key={typeof res.id !== 'undefined' ? String(res.id) : `result-${i}`}
                          className='border-b border-stone-100 last:border-0 hover:bg-stone-50/50'
                        >
                          <td className={`cell-center py-2.5 ${rankCls}`}>
                            {displayOrdType ? '-' : ordStr}
                          </td>
                          <td className='cell-center py-2.5'>
                            <span
                              className='inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm shrink-0 whitespace-nowrap'
                              style={{
                                backgroundColor: gateBg,
                                color: gateLight ? '#171717' : '#fff',
                                border: gateLight ? '1px solid #e5e7eb' : 'none',
                              }}
                            >
                              {no}
                            </span>
                          </td>
                          <td className='py-2.5 font-medium text-foreground whitespace-nowrap'>
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
                          </td>
                          <td className='cell-center py-2.5 text-text-secondary text-sm whitespace-nowrap'>{row.sex ?? '-'}</td>
                          <td className='cell-center py-2.5 text-text-secondary text-sm whitespace-nowrap'>{row.age ?? '-'}</td>
                          <td className='cell-center py-2.5 text-sm whitespace-nowrap'>{row.wgBudam != null ? `${row.wgBudam}` : '-'}</td>
                          <td className='py-2.5 text-text-secondary whitespace-nowrap'>
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
                          </td>
                          <td className='py-2.5 text-text-secondary text-sm whitespace-nowrap'>
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
                          </td>
                          <td className='py-2.5 text-text-secondary text-sm whitespace-nowrap'>{row.owName ?? '-'}</td>
                          <td className='cell-right py-2.5 text-text-tertiary font-mono text-xs whitespace-nowrap'>
                            {record}
                          </td>
                          <td className='cell-center py-2.5 text-text-secondary text-xs whitespace-nowrap'>{row.wgHr ?? '-'}</td>
                          <td className='cell-center py-2.5 text-sm whitespace-nowrap'>
                            {row.winOdds != null && !displayOrdType ? (
                              <Tooltip content='단승식 배당률' inline>
                                <span className='cursor-help'>{row.winOdds}</span>
                              </Tooltip>
                            ) : '-'}
                          </td>
                          <td className='cell-center py-2.5 text-sm whitespace-nowrap'>
                            {row.plcOdds != null && !displayOrdType ? (
                              <Tooltip content='연승식 배당률' inline>
                                <span className='cursor-help'>{row.plcOdds}</span>
                              </Tooltip>
                            ) : '-'}
                          </td>
                          <td className='py-2.5 text-text-tertiary text-xs whitespace-nowrap'>{row.hrTool ?? '-'}</td>
                          <td className='cell-center py-2.5'>
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 승식별 배당률 — 승식별로 묶어 조합·배당을 한 줄로 표시 */}
              {Array.isArray(dividends) && dividends.length > 0 && (() => {
                type D = { poolName?: string; pool?: string; chulNo?: string; chulNo2?: string; chulNo3?: string; odds?: number };
                const byPool = (dividends as D[]).reduce((acc, d) => {
                  const key = d.poolName ?? d.pool ?? '배당';
                  if (!acc[key]) acc[key] = [];
                  const combo = [d.chulNo, d.chulNo2, d.chulNo3].filter(Boolean).join('-');
                  if (combo || d.odds != null) acc[key].push({ combo, odds: d.odds });
                  return acc;
                }, {} as Record<string, { combo: string; odds?: number }[]>);
                const poolOrder = ['단승식', '연승식', '쌍승식', '복승식', '삼복승식', '삼쌍승식', '배당'];
                const ordered = poolOrder.filter((p) => byPool[p]?.length).concat(Object.keys(byPool).filter((k) => !poolOrder.includes(k)));
                return (
                  <div className='rounded-xl border border-border overflow-hidden mt-4'>
                    <div className='bg-stone-50 border-b border-border px-3 py-2.5'>
                      <span className='text-sm font-semibold text-foreground'>승식별 배당률</span>
                      <p className='text-text-tertiary text-xs mt-0.5'>경주 확정 후 적용된 배당 (조합·배당)</p>
                    </div>
                    <div className='px-3 py-2.5 space-y-2'>
                      {ordered.map((poolName) => {
                        const items = byPool[poolName];
                        if (!items?.length) return null;
                        const parts = items.map(({ combo, odds }) => (combo && odds != null ? `${combo} ${odds}배` : combo || (odds != null ? `${odds}배` : ''))).filter(Boolean);
                        return (
                          <div key={poolName} className='flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm'>
                            <span className='text-text-secondary font-medium shrink-0 w-16'>{poolName}</span>
                            <span className='text-foreground'>
                              {parts.length > 0 ? parts.join(', ') : '-'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              <p className='mt-3 text-text-tertiary text-xs'>
                제재·심판 리포트·구간별 통과순위 등 상세 성적은{' '}
                <a
                  href='https://race.kra.co.kr/raceScore/ScoretableDetailList.do'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='link-primary'
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
                  }));
                  const normalResults = effectiveResults.filter((res) => {
                    const ord = parseInt(String(res.ord ?? ''), 10);
                    const ok = ord >= 1 && ord <= 3 && (!res.ordType || res.ordType === 'NORMAL');
                    return ok;
                  });
                  const actualTop = normalResults
                    .sort((a, b) => parseInt(String(a.ord), 10) - parseInt(String(b.ord), 10))
                    .slice(0, 3)
                    .map((res) => ({
                      ord: parseInt(String(res.ord), 10),
                      hrNo: String(res.hrNo ?? '').trim(),
                      hrName: (res.hrName ?? '').trim() || '-',
                      ordType: res.ordType,
                    }));
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

          {/* ── Entries (same section/table style as 경주 결과) ── */}
          {showEntriesSection && (
            <section>
              <SectionTitle
                title='출전마'
                icon='ClipboardList'
                badge={displayEntries.length ? `${displayEntries.length}두` : undefined}
                className='mb-2'
              />
              {entries.length > 0 ? (
                <HorseEntryTable
                  entries={entries}
                  onSelectHorse={showPickPanel ? handleSelectHorse : undefined}
                  isSelected={isHorseSelected}
                  raceId={typeof id === 'string' ? id : undefined}
                />
              ) : displayEntries.length > 0 ? (
                <div className='data-table-wrapper rounded-xl border border-border overflow-hidden shadow-sm'>
                  <table className='data-table data-table-compact w-full min-w-[200px]'>
                    <thead>
                      <tr className='bg-stone-50 border-b border-border text-xs text-text-secondary'>
                        <th className='cell-center w-10 py-3 font-semibold'>번호</th>
                        <th className='text-left py-3 min-w-[90px] font-semibold'>마명</th>
                        <th className='text-left py-3 w-20 font-semibold'>기수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayEntries.map((e, i) => (
                        <tr key={e.hrNo ?? i} className='border-b border-stone-100 last:border-0 hover:bg-stone-50/50'>
                          <td className='cell-center py-2.5 font-semibold text-stone-700'>
                            {e.chulNo ?? (e.hrNo && String(e.hrNo).length <= 2 ? e.hrNo : '-')}
                          </td>
                          <td className='py-2.5 font-medium text-foreground'>{e.hrName}</td>
                          <td className='py-2.5 text-text-secondary'>{e.jkName ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

          {/* ── Jockey·horse integrated analysis (same section/table style as 경주 결과·출전마) ── */}
          <section>
            <SectionTitle
              title='기수·말 통합 분석'
              icon='BarChart2'
              badge={jockeyAnalysis?.entriesWithScores?.length ? `${jockeyAnalysis.entriesWithScores.length}두` : undefined}
              className='mb-2'
            />
            {jockeyLoading ? (
              <div className='data-table-wrapper rounded-xl border border-border overflow-hidden shadow-sm bg-white'>
                <div className='py-6 flex justify-center'>
                  <LoadingSpinner size={22} label='분석 중...' />
                </div>
              </div>
            ) : jockeyError ? (
              <div className='rounded-xl border border-border bg-muted/20 px-4 py-6 text-center'>
                <p className='text-text-secondary text-sm'>분석 정보를 확인할 수 없습니다.</p>
                <button
                  type='button'
                  onClick={() => refetchJockey()}
                  className='btn-secondary mt-2 text-sm px-3 py-1.5'
                >
                  다시 시도
                </button>
              </div>
            ) : jockeyAnalysis?.entriesWithScores?.length ? (
              <div className='space-y-3'>
                {jockeyAnalysis.weightRatio && (
                  <p className='text-text-tertiary text-xs'>
                    반영 비율: 말 {Math.round(jockeyAnalysis.weightRatio.horse * 100)}% · 기수{' '}
                    {Math.round(jockeyAnalysis.weightRatio.jockey * 100)}% (참고용)
                  </p>
                )}
                <div className='data-table-wrapper rounded-xl border border-border overflow-hidden shadow-sm'>
                  <table className='data-table data-table-compact w-full min-w-[320px]'>
                    <thead>
                      <tr className='bg-stone-50 border-b border-border text-xs text-text-secondary'>
                        <th className='cell-center w-10 py-3 font-semibold'>순위</th>
                        <th className='cell-center w-10 py-3 font-semibold'>번호</th>
                        <th className='text-left py-3 min-w-[90px] font-semibold'>마명</th>
                        <th className='text-left py-3 w-20 font-semibold'>기수</th>
                        <th className='cell-right py-3 w-14 font-semibold'>말점수</th>
                        <th className='cell-right py-3 w-14 font-semibold'>기수점수</th>
                        <th className='cell-right py-3 w-14 font-semibold'>통합</th>
                      </tr>
                    </thead>
                    <tbody>
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
                            const entryChulNo = displayEntries.find((x) => x.hrNo === e.hrNo)?.chulNo;
                            const no =
                              (entryChulNo ?? e.chulNo ?? (e.hrNo && String(e.hrNo).length <= 2 ? e.hrNo : '')) || '-';
                            const gateNo = parseInt(String(no === '-' ? '0' : no), 10) || 0;
                            const gateBg = getGateBgColor(gateNo);
                            const gateLight = ['#ffffff', '#fde047', '#facc15', '#38bdf8', '#84cc16', '#fde047'].includes(gateBg);
                            const rankCls =
                              i === 0
                                ? 'text-foreground font-bold'
                                : i === 1
                                  ? 'text-stone-600 font-bold'
                                  : i === 2
                                    ? 'text-stone-500 font-bold'
                                    : 'text-text-tertiary';
                            return (
                              <tr
                                key={e.hrNo}
                                className='border-b border-stone-100 last:border-0 hover:bg-stone-50/50'
                              >
                                <td className='cell-center py-2.5'>
                                  <PredictionSymbol type={scoreToSymbol(i + 1)} size='sm' />
                                </td>
                                <td className='cell-center py-2.5'>
                                  <span
                                    className='inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm shrink-0 whitespace-nowrap'
                                    style={{
                                      backgroundColor: gateBg,
                                      color: gateLight ? '#171717' : '#fff',
                                      border: gateLight ? '1px solid #e5e7eb' : 'none',
                                    }}
                                  >
                                    {no}
                                  </span>
                                </td>
                                <td className='py-2.5 font-medium text-foreground whitespace-nowrap'>
                                  {e.hrName ?? '-'}
                                </td>
                                <td className='py-2.5 text-text-secondary whitespace-nowrap'>
                                  {e.jkName ?? '-'}
                                </td>
                                <td className='cell-right py-2.5 text-text-tertiary font-mono text-xs tabular-nums'>
                                  {e.horseScore != null ? Math.round(e.horseScore) : '-'}
                                </td>
                                <td className='cell-right py-2.5 text-text-tertiary font-mono text-xs tabular-nums'>
                                  {e.jockeyScore != null ? Math.round(e.jockeyScore) : '-'}
                                </td>
                                <td className={`cell-right py-2.5 font-bold font-mono text-xs tabular-nums ${rankCls}`}>
                                  {e.combinedScore != null ? Math.round(e.combinedScore) : '-'}
                                </td>
                              </tr>
                            );
                          },
                        )}
                    </tbody>
                  </table>
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
      {/* Toolbar: prediction count + regenerate (section title "AI 예측" is above) */}
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-1.5'>
          {list.length > 1 && <span className='text-text-tertiary text-sm'>({list.length}건)</span>}
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
            <div className='data-table-wrapper rounded-xl border border-border overflow-hidden shadow-sm'>
              <table className='data-table data-table-compact w-full text-sm'>
                <thead>
                  <tr className='bg-stone-50 border-b border-border text-xs text-text-secondary'>
                    <th className='cell-center py-3 w-10 font-semibold'>순위</th>
                    <th className='cell-center py-3 w-10 font-semibold'>번호</th>
                    <th className='text-left py-3 min-w-[90px] font-semibold'>마명</th>
                    <th className='cell-right py-3 w-14 font-semibold'>점수</th>
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
                      <tr key={i} className='border-b border-stone-100 last:border-0 hover:bg-stone-50/50'>
                        <td className='cell-center py-2.5'>
                          <PredictionSymbol type={scoreToSymbol(i + 1)} size='sm' />
                        </td>
                        <td className='cell-center py-2.5 font-semibold text-stone-700'>
                          {no}
                        </td>
                        <td className='py-2.5'>
                          <span className='font-medium text-foreground'>
                            {h.hrName ?? h.horseName ?? '-'}
                          </span>
                          {h.reason && (
                            <p className='text-text-tertiary text-xs line-clamp-1 mt-0.5'>
                              {h.reason}
                            </p>
                          )}
                        </td>
                        <td className={`cell-right py-2.5 font-bold ${rankCls}`}>
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
