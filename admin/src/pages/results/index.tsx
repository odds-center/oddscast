import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import Table from '@/components/common/Table';
import SyncProgressBar from '@/components/common/SyncProgressBar';
import Pagination from '@/components/common/Pagination';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { adminResultsApi, adminRacesApi, adminKraApi } from '@/lib/api/admin';
import { formatDate, getErrorMessage, getTodayKstDate, getKstDateOffset } from '@/lib/utils';

interface RaceResult {
  id?: string;
  resultId?: string;
  raceId: string;
  rcDate: string;
  rcNo: string;
  rcName: string;
  meet: string;
  meetName: string;
  rcDist: string;
  ord: string;
  hrName: string;
  hrNo: string;
  chulNo?: string;
  jkName: string;
  trName: string;
  rcTime: string;
  chaksun1?: number;
  rcRank?: string;
  rcPrize?: number;
  createdAt: string;
}

type ResultUpdateDto = { ord?: string; rcTime?: string; chaksun1?: number };

type EditResultForm = { ord: string; rcTime: string; chaksun1: string };

// 결과 수정 모달
function EditResultModal({
  result,
  onClose,
  onSave,
  isPending,
}: {
  result: RaceResult;
  onClose: () => void;
  onSave: (dto: ResultUpdateDto) => void;
  isPending: boolean;
}) {
  const { register, handleSubmit, reset } = useForm<EditResultForm>({
    defaultValues: {
      ord: result.ord || result.rcRank || '',
      rcTime: result.rcTime || '',
      chaksun1: String(result.chaksun1 ?? result.rcPrize ?? ''),
    },
  });

  useEffect(() => {
    reset({
      ord: result.ord || result.rcRank || '',
      rcTime: result.rcTime || '',
      chaksun1: String(result.chaksun1 ?? result.rcPrize ?? ''),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const onSubmit = (data: EditResultForm) => {
    onSave({
      ord: data.ord,
      rcTime: data.rcTime,
      chaksun1: data.chaksun1 ? parseInt(data.chaksun1, 10) : undefined,
    });
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4' onClick={(e) => e.stopPropagation()}>
        <h2 className='text-xl font-bold mb-4'>결과 수정</h2>
        <p className='text-sm text-gray-600 mb-4'>
          {result.hrName} (출전번호 {result.chulNo ?? result.hrNo})
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>착순</label>
            <input
              type='text'
              className='w-full px-3 py-2 border rounded-md'
              placeholder='1'
              {...register('ord')}
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>기록</label>
            <input
              type='text'
              className='w-full px-3 py-2 border rounded-md'
              placeholder='1:12.3'
              {...register('rcTime')}
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>상금 (원)</label>
            <input
              type='number'
              className='w-full px-3 py-2 border rounded-md'
              placeholder='0'
              {...register('chaksun1')}
            />
          </div>
          <div className='flex gap-2 mt-6'>
            <Button type='submit' variant='primary' disabled={isPending} isLoading={isPending}>
              저장
            </Button>
            <Button type='button' variant='ghost' onClick={onClose}>취소</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RaceOption {
  id: number;
  meet?: string;
  meetName?: string;
  rcDate?: string;
  rcNo?: string;
  rcName?: string;
}

type CreateResultForm = {
  raceId: string;
  hrNo: string;
  hrName: string;
  jkName: string;
  trName: string;
  ord: string;
  rcTime: string;
  chaksun1: string;
};

// 결과 등록 모달
function CreateResultModal({
  races,
  onClose,
  onSave,
  isPending,
}: {
  races: RaceOption[];
  onClose: () => void;
  onSave: (dto: {
    raceId: string;
    hrNo: string;
    hrName: string;
    jkName?: string;
    trName?: string;
    ord?: string;
    rcTime?: string;
    chaksun1?: number;
  }) => void;
  isPending: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateResultForm>({
    defaultValues: {
      raceId: '',
      hrNo: '',
      hrName: '',
      jkName: '',
      trName: '',
      ord: '',
      rcTime: '',
      chaksun1: '',
    },
  });

  const onSubmit = (data: CreateResultForm) => {
    if (!data.raceId || !data.hrNo || !data.hrName) {
      toast.error('경주, 출전번호, 마명은 필수입니다');
      return;
    }
    onSave({
      raceId: data.raceId,
      hrNo: data.hrNo,
      hrName: data.hrName,
      jkName: data.jkName || undefined,
      trName: data.trName || undefined,
      ord: data.ord || undefined,
      rcTime: data.rcTime || undefined,
      chaksun1: data.chaksun1 ? parseInt(data.chaksun1, 10) : undefined,
    });
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto' onClick={(e) => e.stopPropagation()}>
        <h2 className='text-xl font-bold mb-4'>결과 수동 등록</h2>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>경주 *</label>
            <select
              className='w-full px-3 py-2 border rounded-md'
              {...register('raceId', { required: '경주를 선택하세요.' })}
            >
              <option value=''>경주 선택</option>
              {races.map((r) => {
                const dateStr =
                  r.rcDate && r.rcDate.length >= 8
                    ? `${r.rcDate.slice(0, 4)}-${r.rcDate.slice(4, 6)}-${r.rcDate.slice(6, 8)}`
                    : r.rcDate;
                const label = `${r.meetName ?? r.meet ?? ''} ${r.rcNo ?? ''}경 (${dateStr ?? ''})`;
                return (
                  <option key={r.id} value={String(r.id)}>
                    {label}
                  </option>
                );
              })}
            </select>
            {errors.raceId && <p className='text-sm text-red-600 mt-1'>{errors.raceId.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>출전번호 *</label>
            <input
              type='text'
              className='w-full px-3 py-2 border rounded-md'
              placeholder='해당 경주의 출전번호 (예: 1, 2, 3)'
              {...register('hrNo', { required: '출전번호를 입력하세요.' })}
            />
            {errors.hrNo && <p className='text-sm text-red-600 mt-1'>{errors.hrNo.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>마명 *</label>
            <input
              type='text'
              className='w-full px-3 py-2 border rounded-md'
              placeholder='마명'
              {...register('hrName', { required: '마명을 입력하세요.' })}
            />
            {errors.hrName && <p className='text-sm text-red-600 mt-1'>{errors.hrName.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>기수명</label>
            <input type='text' className='w-full px-3 py-2 border rounded-md' {...register('jkName')} />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>조교사명</label>
            <input type='text' className='w-full px-3 py-2 border rounded-md' {...register('trName')} />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>착순</label>
            <input type='text' className='w-full px-3 py-2 border rounded-md' placeholder='1' {...register('ord')} />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>기록</label>
            <input type='text' className='w-full px-3 py-2 border rounded-md' placeholder='1:12.3' {...register('rcTime')} />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>상금 (원)</label>
            <input type='number' className='w-full px-3 py-2 border rounded-md' {...register('chaksun1')} />
          </div>
          <div className='flex gap-2 pt-4'>
            <Button type='submit' disabled={isPending} isLoading={isPending}>
              등록
            </Button>
            <Button type='button' variant='ghost' onClick={onClose}>취소</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// API 응답을 RaceResult 형식으로 정규화
function normalizeResult(raw: Record<string, unknown>): RaceResult {
  const race = (raw.race as Record<string, unknown>) || {};
  return {
    id: raw.id as string,
    resultId: (raw.id ?? raw.resultId) as string,
    raceId: String(raw.raceId ?? ''),
    rcDate: String(race.rcDate ?? raw.rcDate ?? ''),
    rcNo: String(race.rcNo ?? raw.rcNo ?? ''),
    rcName: String(race.rcName ?? race.raceName ?? raw.rcName ?? ''),
    meet: String(race.meet ?? raw.meet ?? ''),
    meetName: String(race.meetName ?? raw.meetName ?? ''),
    rcDist: String(raw.rcDist ?? ''),
    ord: String(raw.ord ?? raw.rcRank ?? ''),
    hrName: String(raw.hrName ?? ''),
    hrNo: String(raw.hrNo ?? ''),
    chulNo: raw.chulNo != null ? String(raw.chulNo) : undefined,
    jkName: String(raw.jkName ?? ''),
    trName: String(raw.trName ?? ''),
    rcTime: String(raw.rcTime ?? ''),
    chaksun1: (raw.chaksun1 ?? raw.rcPrize) as number | undefined,
    createdAt: raw.createdAt as string,
  };
}

// 경주별 결과 그룹화 (웹앱과 동일 — 1·2·3위 한 행)
interface GroupedRace {
  raceId: string;
  meetName: string;
  rcNo: string;
  rcDate: string;
  rcDist: string;
  results: RaceResult[];
}

function groupResultsByRace(raw: RaceResult[]): GroupedRace[] {
  const byRace = new Map<string, { meetName: string; rcNo: string; rcDate: string; rcDist: string; results: RaceResult[] }>();

  for (const r of raw) {
    const ord = parseInt(r.ord ?? '99', 10) || 99;
    if (ord > 3) continue;

    const raceId = String(r.raceId ?? '');
    const meetName = r.meetName || r.meet || '-';
    const rcNo = r.rcNo || '-';
    const rcDate = r.rcDate || '';
    const rcDist = r.rcDist || '';

    if (!byRace.has(raceId)) {
      byRace.set(raceId, { meetName, rcNo, rcDate, rcDist, results: [] });
    }
    byRace.get(raceId)!.results.push(r);
  }

  const list: GroupedRace[] = [];
  for (const [raceId, { meetName, rcNo, rcDate, rcDist, results }] of byRace.entries()) {
    results.sort((a, b) => (parseInt(a.ord, 10) || 99) - (parseInt(b.ord, 10) || 99));
    list.push({ raceId, meetName, rcNo, rcDate, rcDist, results });
  }

  const parseRcNo = (s: string) => {
    const n = parseInt(s, 10);
    return Number.isNaN(n) ? 0 : n;
  };
  list.sort((a, b) => {
    const dateCmp = (a.rcDate || '').localeCompare(b.rcDate || '');
    if (dateCmp !== 0) return -dateCmp;
    return parseRcNo(a.rcNo || '') - parseRcNo(b.rcNo || '');
  });
  return list;
}

/** Same page size as 경주 관리 so both pages show the same race list */
const RACES_PER_PAGE = 20;

const MEET_OPTIONS = [
  { value: '', label: '전체' },
  { value: '서울', label: '서울' },
  { value: '제주', label: '제주' },
  { value: '부산경남', label: '부산' },
] as const;

export default function ResultsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState(() => getTodayKstDate());
  const [meetFilter, setMeetFilter] = useState('');
  const [selectedResult, setSelectedResult] = useState<RaceResult | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupedRace | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ percent: number; message: string } | null>(null);

  const dateTo = getTodayKstDate().replace(/-/g, '');
  const dateFrom = getKstDateOffset(-30).replace(/-/g, '');

  const syncResultsMutation = useMutation({
    mutationFn: async (date: string) => {
      const out = await adminKraApi.syncResultsWithProgress(date, {
        onProgress: (p, m) => setSyncProgress({ percent: p, message: m }),
      });
      if (out.error) throw new Error(out.error);
      return out.result;
    },
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['admin-results'] });
      const msg = (res as { message?: string })?.message ?? '경기 결과 KRA 동기화 완료';
      toast.success(msg);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
    onSettled: () => setSyncProgress(null),
  });

  const { data: racesData } = useQuery({
    queryKey: ['admin-races-for-result', dateFrom, dateTo],
    queryFn: () => adminRacesApi.getAll({ page: 1, limit: 200, dateFrom, dateTo }),
    enabled: createModalOpen,
  });
  const raceOptions: RaceOption[] = (racesData?.data ?? []) as RaceOption[];

  // Same API shape as 경주 관리: groupByRace + same page/limit/date/meet so race list is identical
  const { data, isLoading, error: resultsError, refetch: refetchResults } = useQuery({
    queryKey: ['admin-results', page, dateFilter, meetFilter],
    queryFn: async () => {
      const res = await adminResultsApi.getAllGroupedByRace({
        page,
        limit: RACES_PER_PAGE,
        ...(dateFilter && { date: dateFilter.replace(/-/g, '').slice(0, 8) }),
        ...(meetFilter && { meet: meetFilter }),
      });
      const groups: GroupedRace[] = (res.data || []).map((g) => ({
        raceId: g.race.id,
        meetName: g.race.meetName ?? g.race.meet ?? '-',
        rcNo: g.race.rcNo ?? '-',
        rcDate: g.race.rcDate ?? '',
        rcDist: g.race.rcDist ?? '',
        results: (g.results || []).map((r) =>
          normalizeResult({
            ...r,
            race: g.race,
            raceId: g.race.id,
          } as Record<string, unknown>)
        ),
      }));
      return {
        data: groups,
        meta: res.meta,
      };
    },
  });

  const groupedRaces = data?.data ?? [];
  const totalGroupPages = data?.meta?.totalPages ?? 1;
  const paginatedGroups = groupedRaces;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminResultsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-results'] });
      setSelectedResult(null);
      toast.success('결과가 삭제되었습니다');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ResultUpdateDto }) => adminResultsApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-results'] });
      setEditModalOpen(false);
      setSelectedResult(null);
      toast.success('수정되었습니다');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const createMutation = useMutation({
    mutationFn: (dto: { raceId: string; hrNo: string; hrName: string; jkName?: string; trName?: string; ord?: string; rcTime?: string; chaksun1?: number }) => adminResultsApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-results'] });
      setCreateModalOpen(false);
      toast.success('결과가 등록되었습니다');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  function renderRankCell(group: GroupedRace, ord: '1' | '2' | '3') {
    const r = group.results.find((x) => x.ord === ord);
    if (!r) return <span className='text-gray-400'>-</span>;
    const no = r.chulNo ?? (r.hrNo && r.hrNo.length <= 3 ? r.hrNo : '-');
    return (
      <span className='inline-flex items-center gap-1.5'>
        <span className='inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium'>
          {no}
        </span>
        <span className='font-medium'>{r.hrName}</span>
        <span className='text-gray-500 text-sm'>({r.jkName})</span>
      </span>
    );
  }

  const columns = [
    {
      key: 'race',
      header: '경주',
      className: 'w-28',
      render: (group: GroupedRace) => (
        <span className='font-medium'>
          {group.meetName} {group.rcNo}경
        </span>
      ),
    },
    {
      key: 'rcDate',
      header: '날짜',
      className: 'w-24',
      render: (group: GroupedRace) => {
        const dateStr = group.rcDate;
        if (dateStr && dateStr.length === 8) {
          return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        }
        return dateStr;
      },
    },
    {
      key: 'ord1',
      header: '1위',
      className: 'min-w-[140px]',
      render: (group: GroupedRace) => renderRankCell(group, '1'),
    },
    {
      key: 'ord2',
      header: '2위',
      className: 'min-w-[140px]',
      render: (group: GroupedRace) => renderRankCell(group, '2'),
    },
    {
      key: 'ord3',
      header: '3위',
      className: 'min-w-[140px]',
      render: (group: GroupedRace) => renderRankCell(group, '3'),
    },
    {
      key: 'actions',
      header: '작업',
      className: 'w-24',
      render: (group: GroupedRace) => (
        <div className='flex items-center gap-1' onClick={(e) => e.stopPropagation()}>
          <Button size='sm' variant='ghost' onClick={() => setSelectedGroup(group)}>
            관리
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>경기 결과 | OddsCast Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader
            title='경기 결과'
            description='경주 결과(착순·기록·배당)를 조회·등록·수정합니다. Cron으로 매일 17:30 자동 수집되며, 누락 시 수동 동기화할 수 있습니다.'
          >
            <Button onClick={() => setCreateModalOpen(true)}>결과 수동 등록</Button>
          </PageHeader>

          <Card>
            <div className='relative'>
              {syncProgress && (
                <div className='mb-4'>
                  <SyncProgressBar percent={syncProgress.percent} message={syncProgress.message} />
                </div>
              )}
              {syncResultsMutation.isPending && !syncProgress && (
                <div className='absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm'>
                  <LoadingSpinner size='lg' label='경기 결과 적재 중... (수 분 소요될 수 있습니다)' />
                </div>
              )}
              <div className='mb-4 flex flex-wrap items-end gap-3'>
                <div className='flex flex-col'>
                  <label className='mb-1 block text-xs font-medium text-gray-500'>날짜</label>
                  <input
                    type='date'
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      setPage(1);
                    }}
                    className='h-9 min-w-[140px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
                  />
                </div>
                <div className='flex flex-col'>
                  <label className='mb-1 block text-xs font-medium text-gray-500'>지역</label>
                  <select
                    value={meetFilter}
                    onChange={(e) => {
                      setMeetFilter(e.target.value);
                      setPage(1);
                    }}
                    className='h-9 min-w-[120px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
                  >
                    {MEET_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                {(dateFilter || meetFilter) && (
                  <Button
                    variant='ghost'
                    size='md'
                    onClick={() => {
                      setDateFilter('');
                      setMeetFilter('');
                      setPage(1);
                    }}
                    className='h-9'
                  >
                    필터 초기화
                  </Button>
                )}
                <Button
                  variant='primary'
                  size='md'
                  onClick={() =>
                    syncResultsMutation.mutate(
                      dateFilter ? dateFilter.replace(/-/g, '').slice(0, 8) : getTodayKstDate().replace(/-/g, '')
                    )
                  }
                  disabled={syncResultsMutation.isPending}
                  isLoading={syncResultsMutation.isPending}
                  className='h-9'
                >
                  {syncResultsMutation.isPending ? '적재 중...' : '경기 결과 적재 (KRA)'}
                </Button>
                <span className='text-sm text-gray-500'>
                  선택 날짜 또는 오늘 기준 KRA에서 경주 결과 가져오기
                </span>
              </div>

              {resultsError && (
                <div className='mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
                  <p>경기 결과를 불러오는 중 오류가 발생했습니다.</p>
                  <Button
                    type='button'
                    variant='secondary'
                    size='sm'
                    className='mt-2'
                    onClick={() => refetchResults()}
                  >
                    다시 시도
                  </Button>
                </div>
              )}
              <Table
              data={paginatedGroups}
              columns={columns}
              isLoading={isLoading}
              emptyMessage='경기 결과가 없습니다.'
              getRowKey={(group) => group.raceId}
              onRowClick={(group) => router.push(`/races/${group.raceId}`)}
            />

            {totalGroupPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalGroupPages}
                onPageChange={setPage}
              />
            )}
            </div>
          </Card>
        </div>

        {/* 결과 수정 모달 */}
        {editModalOpen && selectedResult && (
          <EditResultModal
            result={selectedResult}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedResult(null);
            }}
            onSave={(dto) => {
              updateMutation.mutate({
                id: selectedResult.id || selectedResult.resultId || '',
                dto,
              });
            }}
            isPending={updateMutation.isPending}
          />
        )}

        {/* 결과 등록 모달 */}
        {createModalOpen && (
          <CreateResultModal
            races={raceOptions}
            onClose={() => setCreateModalOpen(false)}
            onSave={(dto) => createMutation.mutate(dto)}
            isPending={createMutation.isPending}
          />
        )}

        {/* 경주별 결과 관리 모달 (1·2·3위 묶어서 표시) */}
        {selectedGroup && (
          <div
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
            onClick={() => setSelectedGroup(null)}
          >
            <div
              className='bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex justify-between items-start mb-4'>
                <h2 className='text-xl font-bold'>
                  {selectedGroup.meetName} {selectedGroup.rcNo}경 · 결과 관리
                </h2>
                <div className='flex items-center gap-2'>
                  <Link href={`/races/${selectedGroup.raceId}`}>
                    <Button size='sm' variant='secondary'>경주 상세</Button>
                  </Link>
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>
              </div>
              <div className='space-y-3'>
                {selectedGroup.results.map((result) => (
                  <div
                    key={result.id || result.resultId}
                    className='flex items-center justify-between py-3 px-4 border border-gray-200 rounded-lg'
                  >
                    <div className='flex items-center gap-4'>
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                          parseInt(result.ord) === 1
                            ? 'bg-yellow-500'
                            : parseInt(result.ord) === 2
                            ? 'bg-gray-400'
                            : parseInt(result.ord) === 3
                            ? 'bg-orange-600'
                            : 'bg-gray-300'
                        } text-white font-bold text-sm`}
                      >
                        {result.ord}
                      </span>
                      <div>
                        <div className='font-semibold'>{result.hrName} (#{result.hrNo})</div>
                        <div className='text-sm text-gray-500'>{result.jkName} · {result.rcTime || '-'}</div>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => {
                          setSelectedResult(result);
                          setEditModalOpen(true);
                        }}
                      >
                        수정
                      </Button>
                      <Button
                        size='sm'
                        variant='danger'
                        onClick={() => {
                          if (confirm('정말 삭제하시겠습니까?')) {
                            deleteMutation.mutate(result.id || result.resultId || '');
                            setSelectedGroup(null);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 결과 상세 모달 */}
        {selectedResult && !editModalOpen && (
          <div
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
            onClick={() => setSelectedResult(null)}
          >
            <div
              className='bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='flex justify-between items-start mb-6'>
                <h2 className='text-2xl font-bold'>경기 결과 상세</h2>
                <button
                  onClick={() => setSelectedResult(null)}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>

              <div className='space-y-4'>
                {/* 경주 정보 */}
                <div className='border-b pb-4'>
                  <h3 className='font-semibold text-lg mb-3'>경주 정보</h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>날짜</label>
                      <div className='text-gray-900'>
                        {selectedResult.rcDate?.length === 8
                          ? `${selectedResult.rcDate.slice(0, 4)}-${selectedResult.rcDate.slice(
                              4,
                              6
                            )}-${selectedResult.rcDate.slice(6, 8)}`
                          : selectedResult.rcDate}
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>경주장</label>
                      <div className='text-gray-900'>{selectedResult.meet}</div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        경주번호
                      </label>
                      <div className='text-gray-900'>{selectedResult.rcNo}R</div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>경주명</label>
                      <div className='text-gray-900'>{selectedResult.rcName}</div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>거리</label>
                      <div className='text-gray-900'>{selectedResult.rcDist}m</div>
                    </div>
                  </div>
                </div>

                {/* 경주마 정보 */}
                <div className='border-b pb-4'>
                  <h3 className='font-semibold text-lg mb-3'>경주마 정보</h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>순위</label>
                      <div className='flex items-center gap-2'>
                        <span
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${
                            parseInt(selectedResult.ord) === 1
                              ? 'bg-yellow-500'
                              : parseInt(selectedResult.ord) === 2
                              ? 'bg-gray-400'
                              : parseInt(selectedResult.ord) === 3
                              ? 'bg-orange-600'
                              : 'bg-gray-300'
                          } text-white font-bold text-lg`}
                        >
                          {selectedResult.ord}
                        </span>
                        <span className='text-2xl font-bold'>{selectedResult.ord}착</span>
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>기록</label>
                      <div className='text-2xl font-bold text-blue-600'>
                        {selectedResult.rcTime}
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>마명</label>
                      <div className='text-gray-900 font-semibold'>{selectedResult.hrName}</div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>출전번호</label>
                      <div className='text-gray-900'>{selectedResult.chulNo ?? selectedResult.hrNo ?? '-'}</div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>기수</label>
                      <div className='text-gray-900'>{selectedResult.jkName}</div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>조교사</label>
                      <div className='text-gray-900'>{selectedResult.trName}</div>
                    </div>
                  </div>
                </div>

                {/* 상금 */}
                {selectedResult.chaksun1 != null && (
                  <div>
                    <h3 className='font-semibold text-lg mb-3'>상금</h3>
                    <div className='bg-green-50 p-4 rounded-lg'>
                      <div className='text-sm text-gray-600 mb-1'>착순 상금</div>
                      <div className='text-3xl font-bold text-green-600'>
                        {selectedResult.chaksun1!.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                )}

                <div className='border-t pt-4 flex gap-2'>
                  <Button
                    variant='primary'
                    className='flex-1'
                    onClick={() => {
                      setEditModalOpen(true);
                    }}
                  >
                    수정
                  </Button>
                  <Button
                    variant='danger'
                    onClick={() => {
                      if (confirm('정말 삭제하시겠습니까?')) {
                        deleteMutation.mutate(selectedResult.id || selectedResult.resultId || '');
                        setSelectedResult(null);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    삭제
                  </Button>
                  <Button
                    variant='ghost'
                    className='flex-1'
                    onClick={() => setSelectedResult(null)}
                  >
                    닫기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
