import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import Table from '@/components/common/Table';
import Pagination from '@/components/common/Pagination';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import SyncProgressBar from '@/components/common/SyncProgressBar';
import { adminRacesApi, adminResultsApi, adminKraApi } from '@/lib/api/admin';
import { formatDate, getDisplayRaceStatus, getErrorMessage, getTodayKstDate, getKstDateOffset } from '@/lib/utils';

// ─── Shared types ──────────────────────────────────────────────

interface RaceData {
  id: string;
  rcNo: string;
  rcName: string;
  rcDate: string;
  rcTime?: string;
  stTime?: string;
  meet: string;
  rcDist: string;
  rank?: string;
  status?: string;
  entries?: unknown[];
}

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
  rcPrize?: number;
  rcRank?: string;
  createdAt: string;
}

interface GroupedRace {
  raceId: string;
  meetName: string;
  rcNo: string;
  rcDate: string;
  rcDist: string;
  results: RaceResult[];
}

interface RaceOption {
  id: number;
  meet?: string;
  meetName?: string;
  rcDate?: string;
  rcNo?: string;
  rcName?: string;
}

type ResultUpdateDto = { ord?: string; rcTime?: string; chaksun1?: number };
type EditResultForm = { ord: string; rcTime: string; chaksun1: string };
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

// ─── Constants ──────────────────────────────────────────────

const MEET_OPTIONS = [
  { value: '', label: '전체' },
  { value: '서울', label: '서울' },
  { value: '제주', label: '제주' },
  { value: '부산경남', label: '부산' },
] as const;

const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'SCHEDULED', label: '예정' },
  { value: 'COMPLETED', label: '종료' },
] as const;

const VIEW_TABS = [
  { key: 'schedule', label: '경주 일정' },
  { key: 'results', label: '경기 결과' },
] as const;

// ─── Helper functions ──────────────────────────────────────

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

// ─── Modals ────────────────────────────────────────────────

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
            <input type='text' className='w-full px-3 py-2 border rounded-md' placeholder='1' {...register('ord')} />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>기록</label>
            <input type='text' className='w-full px-3 py-2 border rounded-md' placeholder='1:12.3' {...register('rcTime')} />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>상금 (원)</label>
            <input type='number' className='w-full px-3 py-2 border rounded-md' placeholder='0' {...register('chaksun1')} />
          </div>
          <div className='flex gap-2 mt-6'>
            <Button type='submit' variant='primary' disabled={isPending} isLoading={isPending}>저장</Button>
            <Button type='button' variant='ghost' onClick={onClose}>취소</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
    defaultValues: { raceId: '', hrNo: '', hrName: '', jkName: '', trName: '', ord: '', rcTime: '', chaksun1: '' },
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
            <select className='w-full px-3 py-2 border rounded-md' {...register('raceId', { required: '경주를 선택하세요.' })}>
              <option value=''>경주 선택</option>
              {races.map((r) => {
                const dateStr = r.rcDate && r.rcDate.length >= 8
                  ? `${r.rcDate.slice(0, 4)}-${r.rcDate.slice(4, 6)}-${r.rcDate.slice(6, 8)}`
                  : r.rcDate;
                return (
                  <option key={r.id} value={String(r.id)}>
                    {r.meetName ?? r.meet ?? ''} {r.rcNo ?? ''}경 ({dateStr ?? ''})
                  </option>
                );
              })}
            </select>
            {errors.raceId && <p className='text-sm text-red-600 mt-1'>{errors.raceId.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>출전번호 *</label>
            <input type='text' className='w-full px-3 py-2 border rounded-md' placeholder='1, 2, 3' {...register('hrNo', { required: '출전번호를 입력하세요.' })} />
            {errors.hrNo && <p className='text-sm text-red-600 mt-1'>{errors.hrNo.message}</p>}
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>마명 *</label>
            <input type='text' className='w-full px-3 py-2 border rounded-md' {...register('hrName', { required: '마명을 입력하세요.' })} />
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
            <Button type='submit' disabled={isPending} isLoading={isPending}>등록</Button>
            <Button type='button' variant='ghost' onClick={onClose}>취소</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────

export default function RacesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // View tab from URL query
  const view = (router.query.view as string) === 'results' ? 'results' : 'schedule';
  const setView = (v: string) => {
    router.replace({ pathname: '/races', query: { ...router.query, view: v } }, undefined, { shallow: true });
  };

  const [page, setPage] = useState(1);
  const [meetFilter, setMeetFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(() => getTodayKstDate());
  const [syncDate, setSyncDate] = useState(() => getTodayKstDate().replace(/-/g, ''));
  const [syncProgress, setSyncProgress] = useState<{ percent: number; message: string } | null>(null);

  // Results-specific state
  const [selectedResult, setSelectedResult] = useState<RaceResult | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupedRace | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Reset page when switching views
  useEffect(() => { setPage(1); }, [view]);

  // ─── Sync mutations (shared) ─────────────────────────────

  const syncScheduleMutation = useMutation({
    mutationFn: async (date: string) => {
      const out = await adminKraApi.syncScheduleWithProgress(date, {
        onProgress: (p, m) => setSyncProgress({ percent: p, message: m }),
      });
      if (out.error) throw new Error(out.error);
      return out.result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      toast.success('출전표 동기화 완료');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
    onSettled: () => setSyncProgress(null),
  });

  const syncResultsMutation = useMutation({
    mutationFn: async (date: string) => {
      const out = await adminKraApi.syncResultsWithProgress(date, {
        onProgress: (p, m) => setSyncProgress({ percent: p, message: m }),
      });
      if (out.error) throw new Error(out.error);
      return out.result;
    },
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      queryClient.invalidateQueries({ queryKey: ['admin-results'] });
      queryClient.invalidateQueries({ queryKey: ['race'] });
      const msg = (res as { result?: { message?: string } })?.result?.message ?? '경주 결과 동기화 완료';
      toast.success(msg);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
    onSettled: () => setSyncProgress(null),
  });

  const syncDetailsMutation = useMutation({
    mutationFn: (date: string) => adminKraApi.syncDetails(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      toast.success('상세정보(훈련·장구 등) 동기화 완료');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const syncAllMutation = useMutation({
    mutationFn: async (date: string) => {
      const out = await adminKraApi.syncAllWithProgress(date, {
        onProgress: (p, m) => setSyncProgress({ percent: p, message: m }),
      });
      if (out.error) throw new Error(out.error);
      return out.result;
    },
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      queryClient.invalidateQueries({ queryKey: ['admin-results'] });
      queryClient.invalidateQueries({ queryKey: ['race'] });
      const msg = (res as { message?: string })?.message ?? '전체 적재 완료';
      toast.success(msg);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
    onSettled: () => setSyncProgress(null),
  });

  const seedSampleMutation = useMutation({
    mutationFn: (date?: string) => adminKraApi.seedSample(date),
    onSuccess: (res: unknown) => {
      queryClient.invalidateQueries({ queryKey: ['admin-races'] });
      const r = res as { races?: number; entries?: number };
      toast.success(`샘플 데이터 적재 완료: ${r?.races ?? 0}경주, ${r?.entries ?? 0}건`);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  // ─── Schedule view queries ───────────────────────────────

  const { data: racesData, isLoading: racesLoading, error: racesError, refetch: refetchRaces } = useQuery({
    queryKey: ['admin-races', page, meetFilter, statusFilter, dateFilter],
    queryFn: () =>
      adminRacesApi.getAll({
        page,
        limit: 20,
        ...(meetFilter && { meet: meetFilter }),
        ...(dateFilter && { date: dateFilter.replace(/-/g, '') }),
      }),
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000,
    enabled: view === 'schedule',
  });

  const allRaces = (racesData?.data || []) as RaceData[];
  const filteredRaces = statusFilter
    ? allRaces.filter((race: RaceData) => {
        const effectiveStatus = getDisplayRaceStatus(race.status, race.rcDate, race.stTime ?? race.rcTime) || 'SCHEDULED';
        const key = effectiveStatus.toUpperCase().replace(/-/g, '_');
        if (statusFilter === 'COMPLETED') return key === 'COMPLETED';
        if (statusFilter === 'SCHEDULED') return key !== 'COMPLETED';
        return true;
      })
    : allRaces;

  // ─── Results view queries ────────────────────────────────

  const dateTo = getTodayKstDate().replace(/-/g, '');
  const dateFrom = getKstDateOffset(-30).replace(/-/g, '');

  const { data: racesForCreate } = useQuery({
    queryKey: ['admin-races-for-result', dateFrom, dateTo],
    queryFn: () => adminRacesApi.getAll({ page: 1, limit: 200, dateFrom, dateTo }),
    enabled: createModalOpen,
  });
  const raceOptions: RaceOption[] = (racesForCreate?.data ?? []) as RaceOption[];

  const { data: resultsData, isLoading: resultsLoading, error: resultsError, refetch: refetchResults } = useQuery({
    queryKey: ['admin-results', page, dateFilter, meetFilter],
    queryFn: async () => {
      const res = await adminResultsApi.getAllGroupedByRace({
        page,
        limit: 20,
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
          normalizeResult({ ...r, race: g.race, raceId: g.race.id } as Record<string, unknown>)
        ),
      }));
      return { data: groups, meta: res.meta };
    },
    enabled: view === 'results',
  });

  const groupedRaces = resultsData?.data ?? [];

  // ─── Result mutations ────────────────────────────────────

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

  // ─── Column definitions ──────────────────────────────────

  const scheduleColumns = [
    { key: 'rcNo', header: '경주번호', className: 'w-24', render: (race: RaceData) => `${race.rcNo}R` },
    { key: 'rcName', header: '경주명' },
    {
      key: 'rcDate', header: '날짜',
      render: (race: RaceData) => race.rcDate?.length === 8
        ? `${race.rcDate.slice(0, 4)}-${race.rcDate.slice(4, 6)}-${race.rcDate.slice(6, 8)}`
        : race.rcDate,
    },
    { key: 'rcTime', header: '시간', render: (race: RaceData) => race.rcTime || '-' },
    { key: 'meet', header: '경주장' },
    { key: 'rcDist', header: '거리', render: (race: RaceData) => `${race.rcDist}m` },
    {
      key: 'entries', header: '출전마', className: 'w-20 text-center',
      render: (race: RaceData) => {
        const n = Array.isArray(race.entries) ? race.entries.length : 0;
        return n > 0 ? <span className='text-gray-700'>{n}마</span> : <span className='text-gray-400'>-</span>;
      },
    },
    {
      key: 'status', header: '상태',
      render: (race: RaceData) => {
        const statusColors: Record<string, string> = {
          SCHEDULED: 'bg-blue-100 text-blue-800',
          IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
          COMPLETED: 'bg-green-100 text-green-800',
          CANCELLED: 'bg-red-100 text-red-800',
        };
        const statusLabels: Record<string, string> = {
          SCHEDULED: '예정', IN_PROGRESS: '진행중', COMPLETED: '완료', CANCELLED: '취소',
        };
        const effectiveStatus = getDisplayRaceStatus(race.status, race.rcDate, race.stTime ?? race.rcTime) || 'SCHEDULED';
        const key = effectiveStatus.toUpperCase().replace(/-/g, '_');
        return (
          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusColors[key] || 'bg-gray-100 text-gray-800'}`}>
            {statusLabels[key] || effectiveStatus || '-'}
          </span>
        );
      },
    },
  ];

  function renderRankCell(group: GroupedRace, ord: '1' | '2' | '3') {
    const r = group.results.find((x) => x.ord === ord);
    if (!r) return <span className='text-gray-400'>-</span>;
    const no = r.chulNo ?? (r.hrNo && r.hrNo.length <= 3 ? r.hrNo : '-');
    return (
      <span className='inline-flex items-center gap-1.5'>
        <span className='inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium'>{no}</span>
        <span className='font-medium'>{r.hrName}</span>
        <span className='text-gray-500 text-sm'>({r.jkName})</span>
      </span>
    );
  }

  const resultsColumns = [
    {
      key: 'race', header: '경주', className: 'w-28',
      render: (group: GroupedRace) => <span className='font-medium'>{group.meetName} {group.rcNo}경</span>,
    },
    {
      key: 'rcDate', header: '날짜', className: 'w-24',
      render: (group: GroupedRace) => group.rcDate?.length === 8
        ? `${group.rcDate.slice(0, 4)}-${group.rcDate.slice(4, 6)}-${group.rcDate.slice(6, 8)}`
        : group.rcDate,
    },
    { key: 'ord1', header: '1위', className: 'min-w-[140px]', render: (group: GroupedRace) => renderRankCell(group, '1') },
    { key: 'ord2', header: '2위', className: 'min-w-[140px]', render: (group: GroupedRace) => renderRankCell(group, '2') },
    { key: 'ord3', header: '3위', className: 'min-w-[140px]', render: (group: GroupedRace) => renderRankCell(group, '3') },
    {
      key: 'actions', header: '작업', className: 'w-24',
      render: (group: GroupedRace) => (
        <div className='flex items-center gap-1' onClick={(e) => e.stopPropagation()}>
          <Button size='sm' variant='ghost' onClick={() => setSelectedGroup(group)}>관리</Button>
        </div>
      ),
    },
  ];

  // ─── Render ──────────────────────────────────────────────

  const hasActiveFilters = !!(meetFilter || statusFilter || dateFilter);
  const isLoading = view === 'schedule' ? racesLoading : resultsLoading;
  const currentError = view === 'schedule' ? racesError : resultsError;

  return (
    <>
      <Head>
        <title>경주 관리 | OddsCast Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader
            title='경주 관리'
            description='경주 일정·출전마·결과를 조회하고 KRA 데이터를 동기화합니다.'
          >
            {view === 'results' && (
              <Button onClick={() => setCreateModalOpen(true)}>결과 수동 등록</Button>
            )}
          </PageHeader>

          {/* View tabs */}
          <div className='flex gap-1 bg-gray-100 rounded-lg p-1 w-fit'>
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  view === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <Card title='필터' className='mb-4'>
            <div className='flex flex-wrap items-end gap-3'>
              <div className='flex flex-col'>
                <label className='mb-1 block text-xs font-medium text-gray-500'>지역</label>
                <select
                  value={meetFilter}
                  onChange={(e) => { setMeetFilter(e.target.value); setPage(1); }}
                  className='h-9 min-w-[120px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
                >
                  {MEET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {view === 'schedule' && (
                <div className='flex flex-col'>
                  <label className='mb-1 block text-xs font-medium text-gray-500'>상태</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className='h-9 min-w-[120px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
                  >
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )}
              <div className='flex flex-col'>
                <label className='mb-1 block text-xs font-medium text-gray-500'>날짜</label>
                <input
                  type='date'
                  value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                  className='h-9 min-w-[140px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
                />
              </div>
              {view === 'results' && (dateFilter || meetFilter) && (
                <Button variant='ghost' size='md' onClick={() => { setDateFilter(''); setMeetFilter(''); setPage(1); }} className='h-9'>
                  필터 초기화
                </Button>
              )}
            </div>
          </Card>

          {/* KRA sync panel — schedule view */}
          {view === 'schedule' && (
            <Card title='빠른 KRA 동기화' description='날짜 선택 후 필요한 데이터를 개별 또는 전체 동기화합니다.'>
              <div className='space-y-4'>
                <div className='flex flex-wrap items-center gap-3'>
                  <input
                    type='date'
                    value={syncDate?.length >= 8 ? `${syncDate.slice(0, 4)}-${syncDate.slice(4, 6)}-${syncDate.slice(6, 8)}` : ''}
                    onChange={(e) => setSyncDate(e.target.value.replace(/-/g, ''))}
                    className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                  />
                  <Button onClick={() => syncScheduleMutation.mutate(syncDate || getTodayKstDate().replace(/-/g, ''))} disabled={syncScheduleMutation.isPending} isLoading={syncScheduleMutation.isPending}>출전표</Button>
                  <Button variant='secondary' onClick={() => syncResultsMutation.mutate(syncDate || getTodayKstDate().replace(/-/g, ''))} disabled={syncResultsMutation.isPending} isLoading={syncResultsMutation.isPending}>경주 결과</Button>
                  <Button variant='secondary' onClick={() => syncDetailsMutation.mutate(syncDate || getTodayKstDate().replace(/-/g, ''))} disabled={syncDetailsMutation.isPending} isLoading={syncDetailsMutation.isPending}>상세정보</Button>
                  <div className='flex flex-wrap items-center gap-3'>
                    <Button variant='primary' onClick={() => syncAllMutation.mutate(syncDate || getTodayKstDate().replace(/-/g, ''))} disabled={syncAllMutation.isPending} isLoading={syncAllMutation.isPending}>전체 적재</Button>
                    {syncProgress && (
                      <div className='min-w-[200px] flex-1 max-w-md'>
                        <SyncProgressBar percent={syncProgress.percent} message={syncProgress.message} />
                      </div>
                    )}
                  </div>
                </div>
                <div className='flex flex-wrap items-center gap-4 text-sm text-gray-500'>
                  <span>
                    <strong>출전표</strong> = 경주계획 + 출전마 |
                    <strong> 결과</strong> = 착순·기록·배당 |
                    <strong> 상세</strong> = 훈련·장구·마체중 |
                    <strong> 전체</strong> = 모두 한 번에
                  </span>
                  <Link href='/kra' className='text-indigo-600 hover:underline ml-auto shrink-0'>KRA 관리 페이지로 →</Link>
                </div>
              </div>
            </Card>
          )}

          {/* Results sync bar — results view */}
          {view === 'results' && (
            <div className='relative'>
              {syncProgress && (
                <div className='mb-4'>
                  <SyncProgressBar percent={syncProgress.percent} message={syncProgress.message} />
                </div>
              )}
              {syncResultsMutation.isPending && !syncProgress && (
                <div className='absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm'>
                  <LoadingSpinner size='lg' label='경기 결과 적재 중...' />
                </div>
              )}
              <div className='flex flex-wrap items-center gap-3 mb-4'>
                <Button
                  variant='primary'
                  size='md'
                  onClick={() => syncResultsMutation.mutate(dateFilter ? dateFilter.replace(/-/g, '').slice(0, 8) : getTodayKstDate().replace(/-/g, ''))}
                  disabled={syncResultsMutation.isPending}
                  isLoading={syncResultsMutation.isPending}
                  className='h-9'
                >
                  {syncResultsMutation.isPending ? '적재 중...' : '경기 결과 적재 (KRA)'}
                </Button>
                <span className='text-sm text-gray-500'>선택 날짜 또는 오늘 기준 KRA에서 경주 결과 가져오기</span>
              </div>
            </div>
          )}

          {/* Data table */}
          <Card>
            {currentError && (
              <div className='mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
                <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
                <Button type='button' variant='secondary' size='sm' className='mt-2' onClick={() => view === 'schedule' ? refetchRaces() : refetchResults()}>
                  다시 시도
                </Button>
              </div>
            )}

            {view === 'schedule' ? (
              <>
                <Table
                  data={filteredRaces}
                  columns={scheduleColumns}
                  isLoading={isLoading}
                  emptyMessage={hasActiveFilters ? '선택한 조건에 맞는 경주가 없습니다.' : '경주가 없습니다. KRA 동기화를 실행하세요.'}
                  onRowClick={(race) => router.push(`/races/${race.id}`)}
                />
                {racesData && (
                  <Pagination currentPage={page} totalPages={racesData.meta.totalPages} onPageChange={setPage} total={racesData.meta.total} limit={20} />
                )}
              </>
            ) : (
              <>
                <Table
                  data={groupedRaces}
                  columns={resultsColumns}
                  isLoading={isLoading}
                  emptyMessage='경기 결과가 없습니다.'
                  getRowKey={(group) => group.raceId}
                  onRowClick={(group) => router.push(`/races/${group.raceId}`)}
                />
                {(resultsData?.meta?.totalPages ?? 1) > 1 && (
                  <Pagination currentPage={page} totalPages={resultsData?.meta?.totalPages ?? 1} onPageChange={setPage} total={resultsData?.meta?.total} limit={20} />
                )}
              </>
            )}
          </Card>
        </div>

        {/* ─── Modals (results view) ──────────────────────── */}

        {editModalOpen && selectedResult && (
          <EditResultModal
            result={selectedResult}
            onClose={() => { setEditModalOpen(false); setSelectedResult(null); }}
            onSave={(dto) => updateMutation.mutate({ id: selectedResult.id || selectedResult.resultId || '', dto })}
            isPending={updateMutation.isPending}
          />
        )}

        {createModalOpen && (
          <CreateResultModal
            races={raceOptions}
            onClose={() => setCreateModalOpen(false)}
            onSave={(dto) => createMutation.mutate(dto)}
            isPending={createMutation.isPending}
          />
        )}

        {selectedGroup && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' onClick={() => setSelectedGroup(null)}>
            <div className='bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto' onClick={(e) => e.stopPropagation()}>
              <div className='flex justify-between items-start mb-4'>
                <h2 className='text-xl font-bold'>{selectedGroup.meetName} {selectedGroup.rcNo}경 · 결과 관리</h2>
                <div className='flex items-center gap-2'>
                  <Link href={`/races/${selectedGroup.raceId}`}>
                    <Button size='sm' variant='secondary'>경주 상세</Button>
                  </Link>
                  <button onClick={() => setSelectedGroup(null)} className='text-gray-400 hover:text-gray-600'>
                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>
              </div>
              <div className='space-y-3'>
                {selectedGroup.results.map((result) => (
                  <div key={result.id || result.resultId} className='flex items-center justify-between py-3 px-4 border border-gray-200 rounded-lg'>
                    <div className='flex items-center gap-4'>
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                        parseInt(result.ord) === 1 ? 'bg-yellow-500' : parseInt(result.ord) === 2 ? 'bg-gray-400' : parseInt(result.ord) === 3 ? 'bg-orange-600' : 'bg-gray-300'
                      } text-white font-bold text-sm`}>
                        {result.ord}
                      </span>
                      <div>
                        <div className='font-semibold'>{result.hrName} (#{result.hrNo})</div>
                        <div className='text-sm text-gray-500'>{result.jkName} · {result.rcTime || '-'}</div>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <Button size='sm' variant='ghost' onClick={() => { setSelectedResult(result); setEditModalOpen(true); }}>수정</Button>
                      <Button size='sm' variant='danger' onClick={() => { if (confirm('정말 삭제하시겠습니까?')) { deleteMutation.mutate(result.id || result.resultId || ''); setSelectedGroup(null); } }} disabled={deleteMutation.isPending}>삭제</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
