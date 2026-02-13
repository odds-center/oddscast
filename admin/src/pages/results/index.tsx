import { useState, useMemo } from 'react';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import Table from '@/components/common/Table';
import Pagination from '@/components/common/Pagination';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { adminResultsApi } from '@/lib/api/admin';
import { formatDate, getErrorMessage } from '@/lib/utils';

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
  jkName: string;
  trName: string;
  rcTime: string;
  chaksun1?: number;
  rcRank?: string;
  rcPrize?: number;
  createdAt: string;
}

type ResultUpdateDto = { ord?: string; rcTime?: string; chaksun1?: number };

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
  const [ord, setOrd] = useState(result.ord || result.rcRank || '');
  const [rcTime, setRcTime] = useState(result.rcTime || '');
  const [chaksun1, setChaksun1] = useState(String(result.chaksun1 ?? result.rcPrize ?? ''));

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4' onClick={(e) => e.stopPropagation()}>
        <h2 className='text-xl font-bold mb-4'>결과 수정</h2>
        <p className='text-sm text-gray-600 mb-4'>
          {result.hrName} (#{result.hrNo})
        </p>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>착순</label>
            <input
              type='text'
              value={ord}
              onChange={(e) => setOrd(e.target.value)}
              className='w-full px-3 py-2 border rounded-md'
              placeholder='1'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>기록</label>
            <input
              type='text'
              value={rcTime}
              onChange={(e) => setRcTime(e.target.value)}
              className='w-full px-3 py-2 border rounded-md'
              placeholder='1:12.3'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>상금 (원)</label>
            <input
              type='number'
              value={chaksun1}
              onChange={(e) => setChaksun1(e.target.value)}
              className='w-full px-3 py-2 border rounded-md'
              placeholder='0'
            />
          </div>
        </div>
        <div className='flex gap-2 mt-6'>
          <Button variant='primary' onClick={() => onSave({ ord, rcTime, chaksun1: chaksun1 ? parseInt(chaksun1) : undefined })} disabled={isPending}>
            저장
          </Button>
          <Button variant='ghost' onClick={onClose}>취소</Button>
        </div>
      </div>
    </div>
  );
}

// 결과 등록 모달
function CreateResultModal({
  onClose,
  onSave,
  isPending,
}: {
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
  const [raceId, setRaceId] = useState('');
  const [hrNo, setHrNo] = useState('');
  const [hrName, setHrName] = useState('');
  const [jkName, setJkName] = useState('');
  const [trName, setTrName] = useState('');
  const [ord, setOrd] = useState('');
  const [rcTime, setRcTime] = useState('');
  const [chaksun1, setChaksun1] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!raceId || !hrNo || !hrName) {
      toast.error('경주ID, 마번, 마명은 필수입니다');
      return;
    }
    onSave({
      raceId,
      hrNo,
      hrName,
      jkName: jkName || undefined,
      trName: trName || undefined,
      ord: ord || undefined,
      rcTime: rcTime || undefined,
      chaksun1: chaksun1 ? parseInt(chaksun1) : undefined,
    });
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto' onClick={(e) => e.stopPropagation()}>
        <h2 className='text-xl font-bold mb-4'>결과 수동 등록</h2>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>경주 ID *</label>
            <input
              type='text'
              value={raceId}
              onChange={(e) => setRaceId(e.target.value)}
              required
              className='w-full px-3 py-2 border rounded-md'
              placeholder='UUID'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>마번 *</label>
            <input
              type='text'
              value={hrNo}
              onChange={(e) => setHrNo(e.target.value)}
              required
              className='w-full px-3 py-2 border rounded-md'
              placeholder='등록번호'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>마명 *</label>
            <input
              type='text'
              value={hrName}
              onChange={(e) => setHrName(e.target.value)}
              required
              className='w-full px-3 py-2 border rounded-md'
              placeholder='마명'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>기수명</label>
            <input
              type='text'
              value={jkName}
              onChange={(e) => setJkName(e.target.value)}
              className='w-full px-3 py-2 border rounded-md'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>조교사명</label>
            <input
              type='text'
              value={trName}
              onChange={(e) => setTrName(e.target.value)}
              className='w-full px-3 py-2 border rounded-md'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>착순</label>
            <input
              type='text'
              value={ord}
              onChange={(e) => setOrd(e.target.value)}
              className='w-full px-3 py-2 border rounded-md'
              placeholder='1'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>기록</label>
            <input
              type='text'
              value={rcTime}
              onChange={(e) => setRcTime(e.target.value)}
              className='w-full px-3 py-2 border rounded-md'
              placeholder='1:12.3'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>상금 (원)</label>
            <input
              type='number'
              value={chaksun1}
              onChange={(e) => setChaksun1(e.target.value)}
              className='w-full px-3 py-2 border rounded-md'
            />
          </div>
          <div className='flex gap-2 pt-4'>
            <Button type='submit' disabled={isPending}>등록</Button>
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

  list.sort((a, b) => {
    const dateCmp = (a.rcDate || '').localeCompare(b.rcDate || '');
    if (dateCmp !== 0) return -dateCmp;
    return (a.rcNo || '').localeCompare(b.rcNo || '');
  });
  return list;
}

const GROUPS_PER_PAGE = 20;

export default function ResultsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const [selectedResult, setSelectedResult] = useState<RaceResult | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupedRace | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-results', dateFilter],
    queryFn: async () => {
      const res = await adminResultsApi.getAll({ page: 1, limit: 250, date: dateFilter });
      const normalized = (res.data || []).map(normalizeResult);
      return { data: normalized };
    },
  });

  const groupedRaces = useMemo(() => groupResultsByRace(data?.data || []), [data?.data]);
  const totalGroupPages = Math.ceil(groupedRaces.length / GROUPS_PER_PAGE) || 1;
  const paginatedGroups = useMemo(
    () =>
      groupedRaces.slice((page - 1) * GROUPS_PER_PAGE, page * GROUPS_PER_PAGE),
    [groupedRaces, page]
  );

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
    const no = r.hrNo && r.hrNo.length <= 3 ? r.hrNo : '-';
    return (
      <span className='inline-flex items-center gap-1.5'>
        <span className='inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium'>
          {no}번
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
        <Button size='sm' variant='ghost' onClick={() => setSelectedGroup(group)}>
          관리
        </Button>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>경기 결과 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-4'>
          <PageHeader
            title='경기 결과'
            description='경주 결과를 조회하고 수동 등록/수정/삭제할 수 있습니다.'
          >
            <Button onClick={() => setCreateModalOpen(true)}>결과 수동 등록</Button>
          </PageHeader>

          <Card>
            <div className='mb-4 flex gap-4'>
              <input
                type='date'
                value={
                  dateFilter && dateFilter.length >= 8
                    ? `${dateFilter.slice(0, 4)}-${dateFilter.slice(4, 6)}-${dateFilter.slice(6, 8)}`
                    : ''
                }
                onChange={(e) => {
                  setDateFilter(e.target.value.replace(/-/g, ''));
                  setPage(1);
                }}
                className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
              />
              {dateFilter && (
                <Button variant='ghost' onClick={() => { setDateFilter(''); setPage(1); }}>
                  필터 초기화
                </Button>
              )}
            </div>

            <Table
              data={paginatedGroups}
              columns={columns}
              isLoading={isLoading}
              emptyMessage='경기 결과가 없습니다.'
              getRowKey={(group) => group.raceId}
            />

            {totalGroupPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalGroupPages}
                onPageChange={setPage}
              />
            )}
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
                <button
                  onClick={() => setSelectedGroup(null)}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
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
                      <label className='block text-sm font-medium text-gray-700 mb-1'>마번</label>
                      <div className='text-gray-900'>{selectedResult.hrNo}번</div>
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
