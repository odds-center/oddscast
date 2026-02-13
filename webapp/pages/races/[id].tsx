import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import { Card, SectionTitle, TabBar } from '@/components/ui';
import BackLink from '@/components/page/BackLink';
import LoadingSpinner from '@/components/LoadingSpinner';
import RaceHeaderCard from '@/components/race/RaceHeaderCard';
import HorseEntryTable from '@/components/race/HorseEntryTable';
import PredictionSymbol, { scoreToSymbol } from '@/components/race/PredictionSymbol';
import RaceApi from '@/lib/api/raceApi';
import PicksApi, { PICK_TYPE_HORSE_COUNTS } from '@/lib/api/picksApi';
import HorsePickPanel from '@/components/HorsePickPanel';
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

export default function RaceDetailPage() {
  const router = useRouter();
  const { id, view } = router.query;
  const isResultView = view === 'result'; // 결과 페이지에서 진입 시: 승식 숨김, 결과 중심
  const queryClient = useQueryClient();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [pickType, setPickType] = useState<string>('SINGLE');
  const [selectedHorses, setSelectedHorses] = useState<{ hrNo: string; hrName: string }[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  type TabId = 'record' | 'prediction';
  const [activeTab, setActiveTab] = useState<TabId>(isResultView ? 'record' : 'record');

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

  const { data: myPick } = useQuery({
    queryKey: ['picks', 'race', id],
    queryFn: () => PicksApi.getByRace(id as string),
    enabled: !!id && isLoggedIn && CONFIG.picksEnabled,
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
    !!ticketHistory?.tickets?.some(
      (t) => String(t.raceId) === String(id) && t.status === 'USED',
    );

  const { data: fullPredictionData } = useQuery({
    queryKey: ['prediction', 'full', id],
    queryFn: () => PredictionApi.getByRaceId(id as string),
    enabled: !!id && isLoggedIn && !!hasUsedTicketForRace,
  });

  const [fullPredictionFromUse, setFullPredictionFromUse] = useState<PredictionDetailDto | null>(null);

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
          <BackLink href={routes.home} label='목록으로' />
        </div>
      </Layout>
    );
  }

  const r = race as {
    rcName?: string; rcNo?: string; meetName?: string; rcDate?: string;
    rcDist?: string; stTime?: string;
    entries?: Array<{ id?: string; raceId?: number; hrNo: string; hrName: string; jkName?: string; chulNo?: string; wgBudam?: number; horseWeight?: string; trName?: string }>;
    entryDetails?: Array<{ id?: string; raceId?: number; hrNo: string; hrName: string; jkName?: string; chulNo?: string; wgBudam?: number; horseWeight?: string; trName?: string }>;
  };
  const name = r.rcName ?? `경주 ${r.rcNo ?? id}`;
  const entries = (r.entries ?? r.entryDetails ?? []) as Array<{ id?: string; raceId?: number; hrNo: string; hrName: string; jkName?: string; chulNo?: string; wgBudam?: number; horseWeight?: string; trName?: string }>;

  return (
    <Layout title='GOLDEN RACE'>
      <div className='flex flex-col lg:flex-row lg:gap-6 lg:items-start'>
        {/* 메인 콘텐츠 */}
        <div className='flex-1 min-w-0 w-full'>
      <BackLink
        href={isResultView ? routes.results : routes.home}
        label={isResultView ? '결과로' : '목록으로'}
        className='mb-4 md:mb-6 block'
      />

      {/* 코리아레이스 스타일 경주 헤더 */}
      <div className='mb-4'>
        <RaceHeaderCard
          meetName={r.meetName}
          rcNo={r.rcNo}
          stTime={r.stTime}
          rcDist={r.rcDist}
        />
      </div>

      {/* 출전마 — 결과 뷰에서는 선택 불가, 경주 뷰에서는 승식 선택 가능 */}
      <section className='mb-5 md:mb-6'>
        <SectionTitle title='출전마' className='text-base md:text-lg' />
        {isLoggedIn && !isResultView && (
          <p className='text-text-secondary text-xs mb-2'>
            오른쪽(데스크톱) 또는 하단 버튼(모바일)에서 고를 말을 선택하세요.
          </p>
        )}
        {entries.length > 0 ? (
          <HorseEntryTable
            entries={entries}
            onSelectHorse={!isResultView && isLoggedIn && CONFIG.picksEnabled ? handleSelectHorse : undefined}
            isSelected={isHorseSelected}
          />
        ) : (
          <div className='rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center'>
            <p className='text-text-secondary text-sm'>출전마 정보가 없습니다.</p>
            <p className='text-text-tertiary text-xs mt-1'>KRA 출전표 적재 후 표시됩니다.</p>
            <button
              type='button'
              onClick={() => refetchRace()}
              className='btn-secondary mt-3 text-sm'
            >
              다시 불러오기
            </button>
          </div>
        )}
      </section>

      {/* 탭: 경주 결과 | AI 예상 (결과 뷰에서는 탭 숨김, 결과만 표시) */}
      {!isResultView && (
        <TabBar
          options={[
            { value: 'record', label: '경주 결과' },
            { value: 'prediction', label: 'AI 예상' },
          ]}
          value={activeTab}
          onChange={(v) => setActiveTab(v)}
          className='mb-4'
        />
      )}

      {(activeTab === 'record' || isResultView) && (
        <>
          <section className='mb-5 md:mb-6'>
            <SectionTitle title='경주 결과' icon='BarChart2' />
            {(raceResults?.length ?? 0) > 0 ? (
              <>
                <div className='data-table-wrapper mt-3'>
                  <table className='data-table data-table-compact'>
                    <thead>
                      <tr>
                        <th className='cell-center w-10'>순위</th>
                        <th className='cell-center w-10'>No</th>
                        <th className='min-w-[70px]'>마명</th>
                        <th>기수</th>
                        <th className='cell-center w-16'>기록</th>
                      </tr>
                    </thead>
                    <tbody>
                      {raceResults?.slice(0, 14).map((r: { id?: string; ord?: string | number; chulNo?: string; hrNo?: string; hrName?: string; jkName?: string; rcTime?: string }, i: number) => {
                        const ord = String(r.ord ?? i + 1);
                        const rankClass = ord === '1' ? 'text-[var(--color-rank-1)]' : ord === '2' ? 'text-[var(--color-rank-2)]' : ord === '3' ? 'text-[var(--color-rank-3)]' : 'text-text-tertiary';
                        const no = r.chulNo ?? (r.hrNo && r.hrNo.length <= 2 ? r.hrNo : '-');
                        return (
                          <tr key={r.id ?? i}>
                            <td className={`cell-center font-bold ${rankClass}`}>{ord}</td>
                            <td className='cell-center'>{no}</td>
                            <td className='font-medium text-foreground'>{r.hrName}</td>
                            <td className='text-text-secondary'>{r.jkName}</td>
                            <td className='cell-center text-text-tertiary text-xs'>{r.rcTime ?? '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {(dividends?.length ?? 0) > 0 && (
                  <details className='mt-3'>
                    <summary className='text-text-secondary text-sm cursor-pointer py-2 hover:text-foreground'>
                      배당 상세 보기
                    </summary>
                    <Card className='mt-2 p-3'>
                      <div className='flex flex-wrap gap-2 text-xs'>
                        {dividends?.slice(0, 6).map((d: { id?: string; poolName?: string; pool?: string; chulNo?: string; chulNo2?: string; chulNo3?: string; odds?: number }, i: number) => (
                          <span key={d.id ?? i} className='px-2 py-1 rounded bg-secondary text-text-secondary'>
                            {d.poolName ?? d.pool}: {[d.chulNo, d.chulNo2, d.chulNo3].filter(Boolean).join('-')} {d.odds != null ? `→ ${d.odds}원` : ''}
                          </span>
                        ))}
                      </div>
                    </Card>
                  </details>
                )}
              </>
            ) : (
              <p className='text-text-secondary text-sm mt-3'>아직 경주 결과가 없습니다.</p>
            )}
          </section>
          <details className='mb-5 md:mb-6 group'>
            <summary className='list-none cursor-pointer py-2'>
              <span className='text-text-secondary text-sm group-open:text-foreground flex items-center gap-2'>
                <Icon name='BarChart2' size={16} />
                기수·말 통합 분석 (선택)
              </span>
            </summary>
          <section className='mt-2'>
            {!showJockeyAnalysis ? (
              <button type='button' onClick={() => setShowJockeyAnalysis(true)} className='btn-secondary w-full sm:w-auto px-4 py-2 text-sm'>
                분석 보기
              </button>
            ) : jockeyLoading ? (
              <Card className='mt-3 py-8'><LoadingSpinner size={24} label='분석 중...' /></Card>
            ) : jockeyError ? (
              <Card className='mt-3 py-4'>
                <p className='text-text-secondary text-sm'>분석 데이터를 불러올 수 없습니다. (KRA 기수 데이터 필요)</p>
                <button type='button' onClick={() => refetchJockey()} className='btn-secondary mt-2 text-sm'>다시 시도</button>
              </Card>
            ) : jockeyAnalysis?.entriesWithScores?.length ? (
              <Card className='mt-3 space-y-3'>
                {jockeyAnalysis.weightRatio && (
                  <p className='text-text-tertiary text-xs'>
                    말 {Math.round(jockeyAnalysis.weightRatio.horse * 100)}% · 기수 {Math.round(jockeyAnalysis.weightRatio.jockey * 100)}%
                  </p>
                )}
                <div className='space-y-2'>
                  {jockeyAnalysis.entriesWithScores.slice(0, 10).map((e: { hrNo: string; hrName: string; jkName?: string; chulNo?: string; combinedScore?: number }) => {
                    const no = e.chulNo ?? (e.hrNo && String(e.hrNo).length <= 2 ? e.hrNo : '');
                    const noLabel = no ? `${no}번 ` : '';
                    return (
                    <div key={e.hrNo} className='flex items-center justify-between py-1 border-b border-border last:border-0'>
                      <span className='text-foreground font-medium'>{noLabel}{e.hrName} ({e.jkName})</span>
                      <span className='text-primary font-bold'>{Math.round(e.combinedScore ?? 0)}</span>
                    </div>
                  );
                  })}
                </div>
                {jockeyAnalysis.topPickByJockey && (
                  <div className='pt-2 border-t border-border'>
                    <p className='text-text-secondary text-xs mb-1'>기수 점수 1위</p>
                    <p className='text-primary font-semibold'>
                      {jockeyAnalysis.topPickByJockey.hrName} · {jockeyAnalysis.topPickByJockey.jkName}
                    </p>
                  </div>
                )}
              </Card>
            ) : (
              <p className='text-text-secondary text-sm mt-3'>분석 결과가 없습니다.</p>
            )}
          </section>
          </details>
        </>
      )}

      {activeTab === 'prediction' && !isResultView && (
      <>
      {/* AI 예측 */}
      <section className='mb-5 md:mb-6'>
        <SectionTitle
          title={displayPrediction ? 'AI 분석 (예측권 사용)' : 'AI 예상'}
          icon='Target'
        />
        {displayPrediction ? (
          <Card className='mt-3 bg-primary/5 border-primary/30'>
            {displayPrediction?.scores?.horseScores?.length ? (
              <div className='space-y-3'>
                {displayPrediction.scores!.horseScores!.map((h, i) => (
                  <div key={i} className='flex items-center gap-3 py-2 border-b border-border last:border-0'>
                    <PredictionSymbol type={scoreToSymbol(i + 1)} size='sm' />
                    <div className='flex-1 min-w-0'>
                      <span className='text-foreground font-medium'>
                        {(h.chulNo ?? (h.hrNo && String(h.hrNo).length <= 2 ? `${h.hrNo}번 ` : ''))}{h.hrName ?? h.horseName ?? '-'}
                      </span>
                      {h.reason && <p className='text-text-secondary text-xs mt-0.5'>{h.reason}</p>}
                    </div>
                    {h.score != null && (
                      <span className='text-primary font-bold shrink-0'>{Math.round(h.score)}%</span>
                    )}
                  </div>
                ))}
                {displayPrediction.analysis && (
                  <div className='mt-3 pt-3 border-t border-border'>
                    <p className='text-text-secondary text-sm whitespace-pre-wrap'>
                      {displayPrediction.analysis}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className='text-text-secondary text-sm'>
                {displayPrediction.analysis || 'AI 분석 내용이 없습니다.'}
              </p>
            )}
          </Card>
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
                      {getErrorMessage(useTicketMutation.error)}
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
      </>
      )}
        </div>

        {/* 데스크톱: 출전마 선택 사이드바 (경주 뷰 + 로그인 시에만, Picks 활성화 시) */}
        {isLoggedIn && !isResultView && CONFIG.picksEnabled && (
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

        {/* 모바일: 출전마 고르기 Drawer 트리거 + Drawer (경주 뷰 + 로그인 시에만, Picks 활성화 시) */}
        {isLoggedIn && !isResultView && CONFIG.picksEnabled && (
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
