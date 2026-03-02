import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import Card from '@/components/common/Card';
import PageLoading from '@/components/common/PageLoading';
import Button from '@/components/common/Button';
import { adminRacesApi, adminKraApi, AdminAIApi } from '@/lib/api/admin';
import { isRaceActuallyEnded, getDisplayRaceStatus } from '@/lib/utils';

type EditRaceForm = {
  rcName?: string;
  rcDist?: string;
  rank?: string;
  rcCondition?: string;
  weather?: string;
  track?: string;
};

interface RaceEntryRow {
  id?: number;
  hrNo?: string;
  hrName?: string;
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
  equipment?: string;
  budam?: string;
  owName?: string;
  isScratched?: boolean;
}

/** Prediction scores from API (scores.betTypePredictions) */
interface AdminBetTypePredictions {
  SINGLE?: { hrNo?: string; reason?: string };
  PLACE?: { hrNo?: string; reason?: string };
  QUINELLA?: { hrNos?: [string, string]; combinations?: Array<{ hrNos: [string, string] }>; reason?: string };
  EXACTA?: { first?: string; second?: string; combinations?: Array<{ first: string; second: string }>; reason?: string };
  QUINELLA_PLACE?: { hrNos?: [string, string]; combinations?: Array<{ hrNos: [string, string] }>; reason?: string };
  TRIFECTA?: { hrNos?: [string, string, string]; combinations?: Array<{ hrNos: [string, string, string] }>; reason?: string };
  TRIPLE?: { first?: string; second?: string; third?: string; combinations?: Array<{ first: string; second: string; third: string }>; reason?: string };
}

const BET_TYPE_LABELS: Record<string, string> = {
  SINGLE: '단승식',
  PLACE: '복승식',
  QUINELLA: '연승식',
  EXACTA: '쌍승식',
  QUINELLA_PLACE: '복연승식',
  TRIFECTA: '삼복승식',
  TRIPLE: '삼쌍승식',
};

const BET_TYPE_ORDER = ['SINGLE', 'PLACE', 'QUINELLA', 'EXACTA', 'QUINELLA_PLACE', 'TRIFECTA', 'TRIPLE'] as const;

function toNoAndName(hrNoOrChulNo: string, entries: Array<{ hrNo?: string; hrName?: string; chulNo?: string }>): string {
  const v = String(hrNoOrChulNo).trim();
  const e = entries.find(
    (x) => String(x.hrNo ?? '').trim() === v || String(x.chulNo ?? '').trim() === v,
  );
  const no = e?.chulNo ?? (e?.hrNo && e.hrNo.length <= 2 ? e.hrNo : v);
  const name = e?.hrName ?? '';
  return name ? `${no}번 ${name}` : `${no}번`;
}

function BetTypePredictionsTable({
  betTypePredictions,
  entries,
}: {
  betTypePredictions: AdminBetTypePredictions;
  entries: Array<{ hrNo?: string; hrName?: string; chulNo?: string }>;
}) {
  const rows: { label: string; combo: string; reason: string }[] = [];
  for (const key of BET_TYPE_ORDER) {
    const pred = betTypePredictions[key as keyof AdminBetTypePredictions];
    if (!pred) {
      rows.push({ label: BET_TYPE_LABELS[key] ?? key, combo: '—', reason: '—' });
      continue;
    }
    const reason = 'reason' in pred && pred.reason ? pred.reason : '—';
    let combo = '—';
    if ('hrNo' in pred && pred.hrNo) {
      combo = toNoAndName(pred.hrNo, entries);
    } else if ('hrNos' in pred && Array.isArray(pred.hrNos)) {
      combo = pred.hrNos.map((h) => toNoAndName(h, entries)).join(' · ');
    } else if ('first' in pred && 'second' in pred) {
      const arr = [pred.first, pred.second];
      if ('third' in pred && pred.third) arr.push(pred.third);
      combo = arr.map((h) => toNoAndName(h ?? '', entries)).join(' → ');
    } else if ('combinations' in pred && Array.isArray(pred.combinations) && pred.combinations.length > 0) {
      combo = pred.combinations
        .slice(0, 3)
        .map((c) => {
          if ('hrNos' in c) return c.hrNos.map((h) => toNoAndName(h, entries)).join('·');
          if ('first' in c && 'second' in c) {
            const arr: string[] = [c.first ?? '', c.second ?? ''];
            if ('third' in c && typeof c.third === 'string') arr.push(c.third);
            return arr.map((h) => toNoAndName(h, entries)).join('→');
          }
          return '—';
        })
        .join(' | ');
    }
    rows.push({ label: BET_TYPE_LABELS[key] ?? key, combo, reason });
  }
  return (
    <div className='mt-4 pt-4 border-t border-gray-200'>
      <label className='block text-sm font-medium text-gray-700 mb-2'>예측 승식 (AI 도출 결과)</label>
      <p className='text-xs text-gray-500 mb-2'>승식별로 AI가 도출한 추천 출전번호·조합과 도출 근거입니다.</p>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[400px] text-sm border-collapse border border-gray-200 rounded-lg'>
          <thead>
            <tr className='bg-gray-50 text-left'>
              <th className='py-2 px-3 font-semibold text-gray-700 border-b border-gray-200 w-24'>승식</th>
              <th className='py-2 px-3 font-semibold text-gray-700 border-b border-gray-200'>추천 조합</th>
              <th className='py-2 px-3 font-semibold text-gray-700 border-b border-gray-200 min-w-[180px]'>도출 근거</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className='border-b border-gray-100 last:border-0'>
                <td className='py-2 px-3 font-medium text-gray-800'>{r.label}</td>
                <td className='py-2 px-3 text-gray-700'>{r.combo}</td>
                <td className='py-2 px-3 text-gray-600 text-xs'>{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface RaceResultRow {
  id?: number;
  ord?: string;
  ordType?: string;
  chulNo?: string;
  hrNo?: string;
  hrName?: string;
  jkName?: string;
  rcTime?: string;
  diffUnit?: string;
  winOdds?: number;
  plcOdds?: number;
}

interface RaceDetail {
  id: number;
  rcNo?: string;
  rcName?: string;
  rcDate?: string;
  rcTime?: string;
  stTime?: string;
  meet?: string;
  meetName?: string;
  rcDist?: string;
  rank?: string;
  rcCondition?: string;
  weather?: string;
  track?: string;
  status?: string;
  entries?: RaceEntryRow[];
  results?: RaceResultRow[];
}

export default function RaceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: raceData, isLoading, error: raceError, refetch: refetchRace } = useQuery({
    queryKey: ['race', id],
    queryFn: () => adminRacesApi.getOne(id as string),
    enabled: !!id,
  });

  const { data: predictionData } = useQuery({
    queryKey: ['admin', 'prediction', 'race', id],
    queryFn: () => AdminAIApi.getPredictionByRace(id as string),
    enabled: !!id,
  });

  const { data: predictionHistoryData } = useQuery({
    queryKey: ['admin', 'prediction', 'race', id, 'history'],
    queryFn: () => AdminAIApi.getPredictionHistoryByRace(Number(id)),
    enabled: !!id,
  });

  const race = raceData as RaceDetail | null | undefined;
  const prediction = predictionData as {
    id?: number;
    analysis?: string | null;
    preview?: string | null;
    status?: string;
    accuracy?: number | null;
    scores?: {
      horseScores?: Array<{ hrNo?: string; chulNo?: string; score?: number; rank?: number; horseNo?: string }>;
      betTypePredictions?: AdminBetTypePredictions;
    };
    horseScores?: Array<{ horseNo?: string; score?: number; rank?: number }>;
  } | null | undefined;

  const { register, handleSubmit, reset } = useForm<EditRaceForm>();

  useEffect(() => {
    if (race && showEditModal) {
      reset({
        rcName: race.rcName ?? '',
        rcDist: race.rcDist ?? '',
        rank: race.rank ?? '',
        rcCondition: race.rcCondition ?? '',
        weather: race.weather ?? '',
        track: race.track ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [race, showEditModal]);

  const updateMutation = useMutation({
    mutationFn: (data: EditRaceForm) =>
      adminRacesApi.update(id as string, {
        rcName: data.rcName,
        rcDist: data.rcDist,
        rank: data.rank,
        rcCondition: data.rcCondition,
        weather: data.weather,
        track: data.track,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['race', id] });
      toast.success('경주 정보가 수정되었습니다');
      setShowEditModal(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : '수정에 실패했습니다';
      toast.error(msg);
    },
  });

  const syncResultsMutation = useMutation({
    mutationFn: (date: string) => adminKraApi.syncResults(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['race', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-results'] });
      toast.success('경기 결과 적재 요청이 완료되었습니다.');
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : '경기 결과 적재 실패');
    },
  });

  const generatePredictionMutation = useMutation({
    mutationFn: (raceId: number) => AdminAIApi.generatePrediction(raceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['race', id] });
      toast.success('AI 예측 생성이 완료되었습니다.');
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : '예측 생성 실패');
    },
  });

  const onEditSubmit = (data: EditRaceForm) => {
    updateMutation.mutate(data);
  };

  const openEditModal = () => setShowEditModal(true);

  if (isLoading) {
    return (
      <>
        <Head>
          <title>경주 상세 | OddsCast Admin</title>
        </Head>
        <Layout>
          <PageLoading label='경주 정보를 불러오는 중...' />
        </Layout>
      </>
    );
  }

  if (raceError) {
    return (
      <>
        <Head>
          <title>경주 상세 | OddsCast Admin</title>
        </Head>
        <Layout>
          <div className='rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-center'>
            <p className='text-amber-800 font-medium'>경주 정보를 불러오는 중 오류가 발생했습니다.</p>
            <div className='mt-4 flex justify-center gap-2'>
              <Button variant='secondary' size='sm' onClick={() => refetchRace()}>
                다시 시도
              </Button>
              <Button variant='ghost' size='sm' onClick={() => router.back()}>
                돌아가기
              </Button>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  if (!race) {
    return (
      <Layout>
        <div className='text-center py-12'>
          <p className='text-gray-500'>경주를 찾을 수 없습니다.</p>
          <Button onClick={() => router.back()} className='mt-4'>
            돌아가기
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>{race.rcName || race.rcNo || '경주'} | OddsCast Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-xl font-bold text-gray-900'>{race.rcName}</h1>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                    (getDisplayRaceStatus(race.status, race.rcDate, race.stTime ?? race.rcTime) || '').toUpperCase() === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {(getDisplayRaceStatus(race.status, race.rcDate, race.stTime ?? race.rcTime) || '').toUpperCase() === 'COMPLETED' ? '완료' : '예정'}
                </span>
              </div>
              <p className='mt-2 text-sm text-gray-600'>경주 상세 정보</p>
            </div>
            <div className='flex gap-2'>
              <Button variant='ghost' onClick={() => router.back()}>
                목록으로
              </Button>
              <Button onClick={openEditModal}>수정</Button>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            <Card title='경주 정보'>
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      경주 번호
                    </label>
                    <div className='text-gray-900 text-lg font-semibold'>{race.rcNo}R</div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>경주장</label>
                    <div className='text-gray-900'>{race.meet}</div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>경주일</label>
                    <div className='text-gray-900'>
                      {race.rcDate?.length === 8
                        ? `${race.rcDate.slice(0, 4)}-${race.rcDate.slice(
                            4,
                            6
                          )}-${race.rcDate.slice(6, 8)}`
                        : race.rcDate}
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>시간</label>
                    <div className='text-gray-900'>{race.rcTime || '-'}</div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>거리</label>
                    <div className='text-gray-900'>{race.rcDist}m</div>
                  </div>
                  {race.rank && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>등급</label>
                      <div className='text-gray-900'>{race.rank}</div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card title='경주명'>
              <div className='text-lg font-semibold'>{race.rcName}</div>
            </Card>

            <Card
              title='예측 정보'
              description='해당 경주에 대한 AI 예측 (완료된 예측만 표시)'
              className='lg:col-span-2'
            >
              {prediction ? (
                <div className='space-y-3'>
                  <div className='flex flex-wrap gap-2'>
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800'>
                      상태: {prediction.status ?? '-'}
                    </span>
                    {prediction.accuracy != null && (
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800'>
                        정확도: {prediction.accuracy}%
                      </span>
                    )}
                  </div>
                  {prediction.preview && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>요약</label>
                      <div className='text-gray-900 whitespace-pre-wrap text-sm'>{prediction.preview}</div>
                    </div>
                  )}
                  {prediction.analysis && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>분석</label>
                      <div className='text-gray-900 whitespace-pre-wrap text-sm rounded border border-gray-200 p-3 bg-gray-50 max-h-64 overflow-y-auto'>
                        {prediction.analysis}
                      </div>
                    </div>
                  )}
                  {(prediction.scores?.horseScores ?? prediction.horseScores) &&
                    Array.isArray(prediction.scores?.horseScores ?? prediction.horseScores) &&
                    (prediction.scores?.horseScores ?? prediction.horseScores)!.length > 0 && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>말별 점수</label>
                      <div className='overflow-x-auto'>
                        <table className='w-full min-w-[280px] text-sm border-collapse'>
                          <thead>
                            <tr className='border-b border-gray-200 bg-gray-50 text-left'>
                              <th className='py-2 px-2 font-semibold text-gray-700'>출전번호</th>
                              <th className='py-2 px-2 font-semibold text-gray-700'>마명</th>
                              <th className='py-2 px-2 font-semibold text-gray-700'>점수</th>
                              <th className='py-2 px-2 font-semibold text-gray-700'>순위</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(
                              (prediction.scores?.horseScores ?? prediction.horseScores) as Array<{
                                horseNo?: string;
                                hrNo?: string;
                                hrName?: string;
                                chulNo?: string;
                                score?: number;
                                rank?: number;
                              }>
                            )
                              .slice()
                              .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                              .map((h, i) => (
                                <tr key={i} className='border-b border-gray-100'>
                                  <td className='py-1.5 px-2'>{h.chulNo ?? h.horseNo ?? '-'}</td>
                                  <td className='py-1.5 px-2'>{h.hrName ?? '-'}</td>
                                  <td className='py-1.5 px-2'>{h.score != null ? h.score : '-'}</td>
                                  <td className='py-1.5 px-2'>{h.rank != null ? h.rank : '-'}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {prediction.scores?.betTypePredictions && race?.entries && race.entries.length > 0 && (
                    <BetTypePredictionsTable
                      betTypePredictions={prediction.scores.betTypePredictions}
                      entries={race.entries as Array<{ hrNo?: string; hrName?: string; chulNo?: string }>}
                    />
                  )}
                </div>
              ) : (
                <div className='text-sm text-gray-500'>이 경주에 대한 완료된 예측이 없습니다. 수동 적재로 생성할 수 있습니다.</div>
              )}
              {Array.isArray(predictionHistoryData) && predictionHistoryData.length > 1 && (
                <div className='mt-3 pt-3 border-t border-gray-200'>
                  <p className='text-xs font-medium text-gray-600 mb-1'>이 경주 예측 이력 ({predictionHistoryData.length}건)</p>
                  <div className='flex flex-wrap gap-2'>
                    {(predictionHistoryData as { id: number; accuracy?: number; createdAt?: string }[]).map((p) => (
                      <span key={p.id} className='inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs'>
                        예측 #{p.id}
                        {p.accuracy != null && ` · ${p.accuracy}%`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card
              title='출전마'
              description='KRA 출전표(API26_2)로 적재된 출전마 정보. 비어 있으면 출전표 수동 동기화를 실행하세요.'
              className='lg:col-span-2'
            >
              {race.entries && race.entries.length > 0 ? (
                <div className='overflow-x-auto'>
                  <table className='w-full min-w-[640px] text-sm border-collapse'>
                    <thead>
                      <tr className='border-b border-gray-200 bg-gray-50 text-left'>
                        <th className='py-2 px-2 font-semibold text-gray-700'>출전번호</th>
                        <th className='py-2 px-2 font-semibold text-gray-700'>마명</th>
                        <th className='py-2 px-2 font-semibold text-gray-700'>기수</th>
                        <th className='py-2 px-2 font-semibold text-gray-700'>조교사</th>
                        <th className='py-2 px-2 font-semibold text-gray-700'>부담중량</th>
                        <th className='py-2 px-2 font-semibold text-gray-700'>레이팅</th>
                        <th className='py-2 px-2 font-semibold text-gray-700'>성별</th>
                        <th className='py-2 px-2 font-semibold text-gray-700'>연령</th>
                        <th className='py-2 px-2 font-semibold text-gray-700'>통산출주</th>
                        <th className='py-2 px-2 font-semibold text-gray-700'>1위</th>
                        <th className='py-2 px-2 font-semibold text-gray-700'>부담</th>
                      </tr>
                    </thead>
                    <tbody>
                      {race.entries.map((e, i) => (
                        <tr key={e.id ?? i} className='border-b border-gray-100 hover:bg-gray-50/50'>
                          <td className='py-1.5 px-2'>{e.chulNo ?? '-'}</td>
                          <td className='py-1.5 px-2'>{e.hrName ?? '-'}</td>
                          <td className='py-1.5 px-2 text-gray-600'>{e.jkName ?? '-'}</td>
                          <td className='py-1.5 px-2 text-gray-600'>{e.trName ?? '-'}</td>
                          <td className='py-1.5 px-2'>{e.wgBudam != null ? `${e.wgBudam}` : '-'}</td>
                          <td className='py-1.5 px-2'>{e.rating != null ? String(e.rating) : '-'}</td>
                          <td className='py-1.5 px-2'>{e.sex ?? '-'}</td>
                          <td className='py-1.5 px-2'>{e.age != null ? String(e.age) : '-'}</td>
                          <td className='py-1.5 px-2'>{e.rcCntT != null ? String(e.rcCntT) : '-'}</td>
                          <td className='py-1.5 px-2'>{e.ord1CntT != null ? String(e.ord1CntT) : '-'}</td>
                          <td className='py-1.5 px-2'>{e.budam ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className='mt-2 text-xs text-gray-500'>{race.entries.length}건 출전마 (DB 적재분)</p>
                </div>
              ) : (
                <div className='rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800'>
                  <p className='font-medium'>출전마 데이터가 없습니다.</p>
                  <p className='mt-1 text-amber-700'>해당 경주일에 KRA 출전표를 동기화하면 DB에 적재됩니다.</p>
                  <Link
                    href={`/kra?date=${(race.rcDate || '').replace(/-/g, '').slice(0, 8)}`}
                    className='inline-flex items-center gap-2 mt-3 px-3 py-2 bg-amber-100 text-amber-900 rounded-md hover:bg-amber-200 text-sm font-medium'
                  >
                    출전표 수동 동기화 →
                  </Link>
                </div>
              )}
            </Card>

            {isRaceActuallyEnded(race.rcDate, race.stTime ?? race.rcTime) &&
              race.results &&
              race.results.length > 0 && (
              <Card title='경주 결과' description='KRA 결과(API4_3) 적재분' className='lg:col-span-2'>
                <div className='overflow-x-auto'>
                  <table className='w-full min-w-[520px] text-sm border-collapse'>
                    <thead>
                      <tr className='border-b border-gray-200 bg-gray-50 text-left'>
                        <th className='py-2 px-2 font-semibold text-gray-700'>순위</th>
                        <th className='py-2 px-2 font-semibold text-gray-700'>출주번호</th>
                        <th className='py-2 px-2 font-semibold text-gray-700'>마명</th>
                        <th className='py-2 px-2 font-semibold text-gray-700'>기수</th>
                        <th className='py-2 px-2 font-semibold text-gray-700'>기록</th>
                        <th className='py-2 px-2 font-semibold text-gray-700'>단승</th>
                        <th className='py-2 px-2 font-semibold text-gray-700'>복승</th>
                      </tr>
                    </thead>
                    <tbody>
                      {race.results
                        .slice()
                        .sort((a, b) => (parseInt(String(a.ord), 10) || 99) - (parseInt(String(b.ord), 10) || 99))
                        .map((r, i) => (
                          <tr key={r.id ?? i} className='border-b border-gray-100 hover:bg-gray-50/50'>
                            <td className='py-1.5 px-2 font-medium'>{r.ord ?? '-'}</td>
                            <td className='py-1.5 px-2'>{r.chulNo ?? r.hrNo ?? '-'}</td>
                            <td className='py-1.5 px-2'>{r.hrName ?? '-'}</td>
                            <td className='py-1.5 px-2 text-gray-600'>{r.jkName ?? '-'}</td>
                            <td className='py-1.5 px-2'>{r.rcTime ?? r.diffUnit ?? '-'}</td>
                            <td className='py-1.5 px-2'>{r.winOdds != null ? `${r.winOdds}배` : '-'}</td>
                            <td className='py-1.5 px-2'>{r.plcOdds != null ? `${r.plcOdds}배` : '-'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  <p className='mt-2 text-xs text-gray-500'>{race.results.length}건 결과 (DB 적재분)</p>
                </div>
              </Card>
            )}

            <Card
              title='수동 적재'
              description='이 경주에 대해 경기 결과 또는 AI 예측을 수동으로 적재합니다.'
              className='lg:col-span-2'
            >
              <div className='flex flex-wrap gap-3'>
                <Button
                  variant='secondary'
                  onClick={() => {
                    const dateStr = (race.rcDate ?? '').replace(/-/g, '').slice(0, 8);
                    if (dateStr.length === 8) syncResultsMutation.mutate(dateStr);
                  }}
                  disabled={syncResultsMutation.isPending || !race.rcDate}
                  isLoading={syncResultsMutation.isPending}
                >
                  {syncResultsMutation.isPending ? '적재 중...' : '경기 결과 적재'}
                </Button>
                <Button
                  variant='secondary'
                  onClick={() => generatePredictionMutation.mutate(race.id)}
                  disabled={generatePredictionMutation.isPending}
                  isLoading={generatePredictionMutation.isPending}
                >
                  {generatePredictionMutation.isPending ? '생성 중...' : '예측 결과 적재'}
                </Button>
              </div>
              <p className='mt-2 text-xs text-gray-500'>
                경기 결과 적재: 선택일(경주일) KRA 결과 동기화. 예측 결과 적재: 해당 경주 AI 예측 생성 (수 분 소요 가능).
              </p>
            </Card>
          </div>

          {showEditModal && (
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
              <div className='bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto'>
                <h2 className='text-lg font-bold mb-4'>경주 수정</h2>
                <form onSubmit={handleSubmit(onEditSubmit)} className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>경주명</label>
                    <input
                      {...register('rcName')}
                      placeholder='경주명'
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>거리 (m)</label>
                    <input
                      {...register('rcDist')}
                      placeholder='예: 1400'
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>등급</label>
                    <input
                      {...register('rank')}
                      placeholder='예: 국6등급'
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>조건</label>
                    <input
                      {...register('rcCondition')}
                      placeholder='경주 조건'
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>날씨</label>
                    <input
                      {...register('weather')}
                      placeholder='예: 맑음'
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>주로</label>
                    <input
                      {...register('track')}
                      placeholder='예: 건조 (2%)'
                      className='w-full px-4 py-2 border rounded-lg'
                    />
                  </div>
                  <div className='flex gap-2 pt-4'>
                    <Button type='submit' variant='primary' disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? '저장 중...' : '저장'}
                    </Button>
                    <Button
                      type='button'
                      variant='secondary'
                      onClick={() => setShowEditModal(false)}
                    >
                      취소
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
