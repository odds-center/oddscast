import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import LoadingSpinner from '@/components/LoadingSpinner';
import RaceApi from '@/lib/api/raceApi';
import PicksApi, { PICK_TYPE_HORSE_COUNTS } from '@/lib/api/picksApi';
import HorsePickPanel from '@/components/HorsePickPanel';
import FavoriteApi from '@/lib/api/favoriteApi';
import PredictionApi from '@/lib/api/predictionApi';
import PredictionTicketApi from '@/lib/api/predictionTicketApi';
import AnalysisApi from '@/lib/api/analysisApi';
import { useAuthStore } from '@/lib/store/authStore';
import Link from 'next/link';
import { routes } from '@/lib/routes';
import { trackCTA } from '@/lib/analytics';

export default function RaceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [pickType, setPickType] = useState<string>('SINGLE');
  const [selectedHorses, setSelectedHorses] = useState<{ hrNo: string; hrName: string }[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    data: race,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['race', id],
    queryFn: () => RaceApi.getRace(id as string),
    enabled: !!id,
  });

  const { data: myPick } = useQuery({
    queryKey: ['picks', 'race', id],
    queryFn: () => PicksApi.getByRace(id as string),
    enabled: !!id && isLoggedIn,
  });

  const { data: favoriteCheck } = useQuery({
    queryKey: ['favorites', 'check', id],
    queryFn: () => FavoriteApi.checkFavorite('RACE', id as string),
    enabled: !!id && isLoggedIn,
  });

  const { data: ticketBalance } = useQuery({
    queryKey: ['prediction-tickets', 'balance'],
    queryFn: () => PredictionTicketApi.getBalance(),
    enabled: !!id && isLoggedIn,
  });

  const { data: ticketHistory } = useQuery({
    queryKey: ['prediction-tickets', 'history'],
    queryFn: () => PredictionTicketApi.getHistory(100, 0, 1),
    enabled: !!id && isLoggedIn,
  });

  const hasUsedTicketForRace =
    !!ticketHistory?.tickets?.some((t) => t.raceId === id && t.status === 'USED');

  const { data: fullPredictionData } = useQuery({
    queryKey: ['prediction', 'full', id],
    queryFn: () => PredictionApi.getByRaceId(id as string),
    enabled: !!id && isLoggedIn && !!hasUsedTicketForRace,
  });

  const [fullPredictionFromUse, setFullPredictionFromUse] = useState<any>(null);

  const useTicketMutation = useMutation({
    mutationFn: (raceId: string) => PredictionTicketApi.use(raceId),
    onSuccess: (data) => {
      setFullPredictionFromUse(data.prediction);
      queryClient.invalidateQueries({ queryKey: ['prediction-tickets', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['prediction-tickets', 'history'] });
    },
  });

  const displayPrediction = fullPredictionFromUse ?? fullPredictionData;
  const availableTickets =
    ticketBalance?.availableTickets ?? ticketBalance?.available ?? 0;

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
  }, [myPick]);

  useEffect(() => {
    setSelectedHorses([]);
  }, [pickType]);

  const pickMutation = useMutation({
    mutationFn: (dto: { raceId: string; pickType: string; hrNos: string[]; hrNames: string[] }) =>
      PicksApi.create(dto),
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

  const favoriteMutation = useMutation({
    mutationFn: () =>
      FavoriteApi.toggleFavorite(
        'RACE',
        id as string,
        (race as any)?.raceName || (race as any)?.rcName || `경주 ${(race as any)?.rcNo}`,
        { raceId: id, meetName: (race as any)?.meetName, rcDate: (race as any)?.rcDate },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', 'check', id] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
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
          <LoadingSpinner size={28} label='경주 정보를 불러오는 중...' />
        </div>
      </Layout>
    );
  }

  if (error || !race) {
    return (
      <Layout>
        <div className='text-center p-6 md:p-8 msg-error'>
          <h2 className='text-lg md:text-xl font-bold mb-4'>경주를 찾을 수 없습니다</h2>
          <Link href={routes.home} className='text-primary font-bold hover:underline'>
            ← 목록으로
          </Link>
        </div>
      </Layout>
    );
  }

  const name = (race as any).raceName || (race as any).rcName || `경주 ${(race as any).rcNo}`;
  const entries = (race as any).entries || (race as any).entryDetails || [];

  return (
    <Layout title={`${(race as any).meetName} - ${name}`}>
      <div className='flex flex-col lg:flex-row lg:gap-6 lg:items-start'>
        {/* 메인 콘텐츠 */}
        <div className='flex-1 min-w-0 w-full'>
      <div className='mb-4 md:mb-6'>
        <Link href={routes.home} className='text-primary text-sm hover:underline'>
          ← 목록으로
        </Link>
      </div>

      <section className='mb-4 md:mb-6 border-b border-border pb-4'>
        <div className='flex items-start justify-between gap-2'>
          <div>
            <h1 className='text-primary m-0 mb-2 md:mb-3 text-lg md:text-2xl font-bold'>{name}</h1>
            <div className='flex gap-2 md:gap-3 flex-wrap items-center text-text-secondary text-xs md:text-sm'>
              <span className='bg-primary-dark text-white px-2 py-0.5 rounded'>
                {(race as any).meetName}
              </span>
              <span>{(race as any).rcDate}</span>
              <span>{(race as any).rcDist}m</span>
              <span>{(race as any).rcGrade}</span>
            </div>
          </div>
          {isLoggedIn && (
            <button
              onClick={() => {
                if (!favoriteCheck?.isFavorite) trackCTA('FAVORITE_ADD', String(id));
                favoriteMutation.mutate();
              }}
              disabled={favoriteMutation.isPending}
              className={`p-2 rounded transition-colors shrink-0 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center ${
                favoriteCheck?.isFavorite
                  ? 'text-primary bg-primary/20'
                  : 'text-text-tertiary hover:text-primary'
              }`}
              aria-label={favoriteCheck?.isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
            >
              <Icon
                name='Heart'
                size={22}
                className={favoriteCheck?.isFavorite ? 'fill-primary text-primary' : ''}
              />
            </button>
          )}
        </div>
      </section>

      {(raceResults?.length ?? 0) > 0 && (
        <section className='mb-4 md:mb-6'>
          <h3 className='text-foreground mb-2 text-sm font-semibold flex items-center gap-2'>
            <Icon name='BarChart2' size={18} />
            경주 결과
          </h3>
          <div className='card space-y-2'>
            {raceResults?.map((r: any, i: number) => (
              <div
                key={r.id ?? i}
                className='flex items-center justify-between py-1 border-b border-border last:border-0'
              >
                <span className='text-primary font-bold w-8'>{r.ord ?? r.rcRank ?? i + 1}</span>
                <span className='text-foreground font-medium flex-1'>
                  {r.hrNo}번 {r.hrName}
                </span>
                <span className='text-text-secondary text-sm'>{r.jkName}</span>
                {r.rcTime && <span className='text-text-tertiary text-xs'>{r.rcTime}</span>}
              </div>
            ))}
          </div>
          {(dividends?.length ?? 0) > 0 && (
            <div className='mt-3 card'>
              <h4 className='text-foreground text-xs font-semibold mb-2'>배당</h4>
              <div className='flex flex-wrap gap-2'>
                {dividends?.map((d: any, i: number) => (
                  <span key={d.id ?? i} className='text-xs px-2 py-1 rounded bg-secondary'>
                    {d.poolName ?? d.pool}:{' '}
                    {[d.chulNo, d.chulNo2, d.chulNo3].filter(Boolean).join('-')} → {d.odds}원
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* AI 예측 — 예측권 사용 시 전체 분석, 미사용 시 미리보기 */}
      <section className='mb-4 md:mb-6'>
        <h3 className='text-foreground mb-2 text-sm font-semibold flex items-center gap-2'>
          <Icon name='Target' size={18} />
          {displayPrediction ? 'AI 분석 (예측권 사용)' : 'AI 예상'}
        </h3>
        {displayPrediction ? (
          <div className='card bg-primary/5 border-primary/30'>
            {(displayPrediction as any).scores?.horseScores?.length > 0 ? (
              <div className='space-y-3'>
                {(displayPrediction as any).scores.horseScores.map((h: any, i: number) => (
                  <div key={i} className='flex items-center justify-between py-1'>
                    <span className='text-foreground font-medium'>
                      {h.hrNo}번 {h.hrName ?? h.horseName ?? '-'}
                    </span>
                    {h.score != null && (
                      <span className='text-primary font-bold'>{Math.round(h.score)}%</span>
                    )}
                    {h.reason && (
                      <p className='text-text-secondary text-xs mt-0.5 col-span-2'>{h.reason}</p>
                    )}
                  </div>
                ))}
                {(displayPrediction as any).analysis && (
                  <div className='mt-3 pt-3 border-t border-border'>
                    <p className='text-text-secondary text-sm whitespace-pre-wrap'>
                      {(displayPrediction as any).analysis}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className='text-text-secondary text-sm'>
                {(displayPrediction as any).analysis || 'AI 분석 내용이 없습니다.'}
              </p>
            )}
          </div>
        ) : (
          <div className='relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 min-h-[160px]'>
            {/* 블러 처리 — 실제 데이터 미사전 로드, 가려진 프리뷰 느낌 */}
            <div className='absolute inset-0 p-4 opacity-30' aria-hidden>
              <div className='space-y-2'>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className='flex justify-between h-5 bg-primary/20 rounded w-full max-w-[90%]' />
                ))}
                <div className='h-12 bg-primary/10 rounded mt-3 w-full' />
              </div>
            </div>
            <div className='absolute inset-0 backdrop-blur-lg bg-background/50' aria-hidden />
            <div className='relative z-10 p-4 sm:p-6 text-center'>
              <p className='text-foreground font-medium mb-1'>
                예측권을 사용해서 전체 AI 분석을 받아보세요
              </p>
              <p className='text-text-secondary text-sm mb-4'>
                마별 승률 예상과 상세 분석을 확인할 수 있습니다
              </p>
              {isLoggedIn && availableTickets > 0 && (
                <>
                  <p className='text-text-tertiary text-xs mb-3'>잔여 예측권 {availableTickets}장</p>
                  <button
                    onClick={() => {
                      trackCTA('PREDICTION_TICKET_USE', String(id));
                      useTicketMutation.mutate(id as string);
                    }}
                    disabled={useTicketMutation.isPending}
                    className='btn-primary px-5 py-2.5 text-sm flex items-center gap-2 mx-auto'
                  >
                    {useTicketMutation.isPending ? (
                      <>
                        <Icon name='Loader2' size={18} className='animate-spin' />
                        분석 받는 중...
                      </>
                    ) : (
                      <>
                        <Icon name='Target' size={18} />
                        예측권 1장 사용하기
                      </>
                    )}
                  </button>
                  {useTicketMutation.isError && (
                    <p className='msg-error mt-3'>
                      {(useTicketMutation.error as any)?.message}
                    </p>
                  )}
                </>
              )}
              {isLoggedIn && availableTickets === 0 && (
                <p className='text-text-secondary text-sm'>
                  예측권이 없습니다.{' '}
                  <Link href={routes.profile.index} className='text-primary hover:underline'>
                    내 정보
                  </Link>
                  에서 구매하세요.
                </p>
              )}
              {!isLoggedIn && (
                <p className='text-text-secondary text-sm'>
                  <Link href={routes.auth.login} className='text-primary font-medium hover:underline'>
                    로그인
                  </Link>
                  후 예측권으로 전체 AI 분석을 확인할 수 있습니다.
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 기수·말 통합 분석 (마칠기삼) — 선택적 로드 */}
      <section className='mb-4 md:mb-6'>
        <h3 className='text-foreground mb-2 text-sm font-semibold flex items-center gap-2'>
          <Icon name='BarChart2' size={18} />
          기수·말 통합 분석 (마칠기삼)
        </h3>
        {!showJockeyAnalysis ? (
          <button
            type='button'
            onClick={() => setShowJockeyAnalysis(true)}
            className='btn-secondary w-full sm:w-auto px-4 py-2 text-sm'
          >
            분석 보기
          </button>
        ) : jockeyLoading ? (
          <div className='card py-8'>
            <LoadingSpinner size={24} label='분석 중...' />
          </div>
        ) : jockeyError ? (
          <div className='card py-4'>
            <p className='text-text-secondary text-sm'>
              분석 데이터를 불러올 수 없습니다. (KRA 기수 데이터 필요)
            </p>
            <button
              type='button'
              onClick={() => refetchJockey()}
              className='btn-secondary mt-2 text-sm'
            >
              다시 시도
            </button>
          </div>
        ) : jockeyAnalysis?.entriesWithScores?.length ? (
          <div className='card space-y-3'>
            {jockeyAnalysis.weightRatio && (
              <p className='text-text-tertiary text-xs'>
                말 {Math.round(jockeyAnalysis.weightRatio.horse * 100)}% · 기수{' '}
                {Math.round(jockeyAnalysis.weightRatio.jockey * 100)}%
              </p>
            )}
            <div className='space-y-2'>
              {jockeyAnalysis.entriesWithScores.slice(0, 10).map((e: any) => (
                <div key={e.hrNo} className='flex items-center justify-between py-1 border-b border-border last:border-0'>
                  <span className='text-foreground font-medium'>
                    {e.hrNo}번 {e.hrName} ({e.jkName})
                  </span>
                  <span className='text-primary font-bold'>{Math.round(e.combinedScore ?? 0)}</span>
                </div>
              ))}
            </div>
            {jockeyAnalysis.topPickByJockey && (
              <div className='pt-2 border-t border-border'>
                <p className='text-text-secondary text-xs mb-1'>기수 점수 1위</p>
                <p className='text-primary font-semibold'>
                  {jockeyAnalysis.topPickByJockey.hrNo}번 {jockeyAnalysis.topPickByJockey.hrName} ·{' '}
                  {jockeyAnalysis.topPickByJockey.jkName}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className='text-text-secondary text-sm'>분석 결과가 없습니다.</p>
        )}
      </section>

      {/* 출전마 상세 — 기수·부담중량·조교 등 정보 (메인에서 항상 확인 가능) */}
      <section className='mb-4'>
        <h3 className='text-foreground mb-2 md:mb-3 text-sm md:text-lg font-semibold'>출전마</h3>
        {isLoggedIn && (
          <p className='text-text-secondary text-xs mb-2'>
            오른쪽(데스크톱) 또는 하단 버튼(모바일)에서 고를 말을 선택하세요.
          </p>
        )}
        {!isLoggedIn && (
          <p className='text-text-secondary text-xs mb-2'>
            로그인하면 내가 고른 말을 저장할 수 있습니다.
          </p>
        )}
        <div className='space-y-1.5'>
          {entries.map((entry: any) => (
            <div
              key={entry.id}
              className='flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-card rounded-xl border border-border'
            >
              <span className='text-primary font-bold w-8 shrink-0'>{entry.hrNo}</span>
              <span className='text-foreground font-medium flex-1 min-w-0'>{entry.hrName}</span>
              <span className='text-text-secondary text-xs md:text-sm shrink-0'>{entry.jkName}</span>
              {entry.trName && (
                <span className='text-text-tertiary text-xs hidden sm:inline shrink-0'>
                  {entry.trName}
                </span>
              )}
              <span className='text-text-tertiary text-xs shrink-0'>
                {entry.weight ?? entry.wgt ?? '-'}kg
              </span>
            </div>
          ))}
          {entries.length === 0 && (
            <p className='text-text-secondary text-sm'>출전마 정보가 없습니다.</p>
          )}
        </div>
      </section>
        </div>

        {/* 데스크톱: 출전마 선택 사이드바 (로그인 시) */}
        {isLoggedIn && (
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

        {/* 모바일: 출전마 고르기 Drawer 트리거 + Drawer */}
        {isLoggedIn && (
          <>
            <button
              onClick={() => setDrawerOpen(true)}
              className='lg:hidden fixed right-4 z-20 flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg touch-manipulation'
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
                    <h3 className='text-lg font-bold text-primary'>출전마 선택</h3>
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
