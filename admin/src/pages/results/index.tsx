import { useState } from 'react';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import Table from '@/components/common/Table';
import Pagination from '@/components/common/Pagination';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { adminResultsApi } from '@/lib/api/admin';
import { formatDate } from '@/lib/utils';

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
  rcRank: string;
  hrName: string;
  hrNo: string;
  jkName: string;
  trName: string;
  rcTime: string;
  rcPrize?: number;
  ord: string;
  createdAt: string;
}

// 결과 수정 모달
function EditResultModal({
  result,
  onClose,
  onSave,
  isPending,
}: {
  result: RaceResult;
  onClose: () => void;
  onSave: (dto: { rcRank?: string; rcTime?: string; rcPrize?: number }) => void;
  isPending: boolean;
}) {
  const [rcRank, setRcRank] = useState(result.rcRank || '');
  const [rcTime, setRcTime] = useState(result.rcTime || '');
  const [rcPrize, setRcPrize] = useState(String(result.rcPrize || ''));

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
              value={rcRank}
              onChange={(e) => setRcRank(e.target.value)}
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
              value={rcPrize}
              onChange={(e) => setRcPrize(e.target.value)}
              className='w-full px-3 py-2 border rounded-md'
              placeholder='0'
            />
          </div>
        </div>
        <div className='flex gap-2 mt-6'>
          <Button variant='primary' onClick={() => onSave({ rcRank, rcTime, rcPrize: rcPrize ? parseInt(rcPrize) : undefined })} disabled={isPending}>
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
  onSave: (dto: any) => void;
  isPending: boolean;
}) {
  const [raceId, setRaceId] = useState('');
  const [hrNo, setHrNo] = useState('');
  const [hrName, setHrName] = useState('');
  const [jkName, setJkName] = useState('');
  const [trName, setTrName] = useState('');
  const [rcRank, setRcRank] = useState('');
  const [rcTime, setRcTime] = useState('');
  const [rcPrize, setRcPrize] = useState('');

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
      rcRank: rcRank || undefined,
      rcTime: rcTime || undefined,
      rcPrize: rcPrize ? parseInt(rcPrize) : undefined,
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
              value={rcRank}
              onChange={(e) => setRcRank(e.target.value)}
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
              value={rcPrize}
              onChange={(e) => setRcPrize(e.target.value)}
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
function normalizeResult(raw: any): RaceResult {
  const race = raw.race || {};
  return {
    id: raw.id,
    resultId: raw.id || raw.resultId,
    raceId: raw.raceId,
    rcDate: race.rcDate || raw.rcDate || '',
    rcNo: race.rcNo || raw.rcNo || '',
    rcName: race.raceName || raw.rcName || '',
    meet: race.meet || raw.meet || '',
    meetName: race.meetName || raw.meetName || '',
    rcDist: raw.rcDist || '',
    rcRank: raw.rcRank || '',
    hrName: raw.hrName || '',
    hrNo: raw.hrNo || '',
    jkName: raw.jkName || '',
    trName: raw.trName || '',
    rcTime: raw.rcTime || '',
    rcPrize: raw.rcPrize,
    ord: raw.ord || '',
    createdAt: raw.createdAt,
  };
}

export default function ResultsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const [selectedResult, setSelectedResult] = useState<RaceResult | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-results', page, dateFilter],
    queryFn: async () => {
      const res = await adminResultsApi.getAll({ page, limit: 20, date: dateFilter });
      const normalized = (res.data || []).map(normalizeResult);
      return { ...res, data: normalized };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminResultsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-results'] });
      setSelectedResult(null);
      toast.success('결과가 삭제되었습니다');
    },
    onError: (err: any) => toast.error(err?.message || '삭제 실패'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => adminResultsApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-results'] });
      setEditModalOpen(false);
      setSelectedResult(null);
      toast.success('수정되었습니다');
    },
    onError: (err: any) => toast.error(err?.message || '수정 실패'),
  });

  const createMutation = useMutation({
    mutationFn: (dto: any) => adminResultsApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-results'] });
      setCreateModalOpen(false);
      toast.success('결과가 등록되었습니다');
    },
    onError: (err: any) => toast.error(err?.message || '등록 실패'),
  });

  const columns = [
    {
      key: 'rcDate',
      header: '날짜',
      render: (result: RaceResult) => {
        const dateStr = result.rcDate;
        if (dateStr && dateStr.length === 8) {
          return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        }
        return dateStr;
      },
    },
    {
      key: 'meetName',
      header: '경주장',
    },
    {
      key: 'rcNo',
      header: '경주',
      className: 'w-20',
      render: (result: RaceResult) => `${result.rcNo}R`,
    },
    {
      key: 'rcName',
      header: '경주명',
    },
    {
      key: 'rcDist',
      header: '거리',
      render: (result: RaceResult) => `${result.rcDist}m`,
    },
    {
      key: 'rank',
      header: '순위',
      className: 'w-16',
      render: (result: RaceResult) => {
        const rank = parseInt(result.rcRank || '0');
        const colors: any = {
          1: 'bg-yellow-500',
          2: 'bg-gray-400',
          3: 'bg-orange-600',
        };
        return (
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
              colors[rank] || 'bg-gray-300'
            } text-white font-bold`}
          >
            {rank}
          </span>
        );
      },
    },
    {
      key: 'horse',
      header: '말',
      render: (result: RaceResult) => (
        <div>
          <div className='font-semibold'>{result.hrName}</div>
          <div className='text-sm text-gray-500'>#{result.hrNo}</div>
        </div>
      ),
    },
    {
      key: 'jockey',
      header: '기수',
      render: (result: RaceResult) => result.jkName,
    },
    {
      key: 'time',
      header: '기록',
      render: (result: RaceResult) => result.rcTime || '-',
    },
    {
      key: 'actions',
      header: '작업',
      render: (result: RaceResult) => (
        <div className='flex gap-2'>
          <Button size='sm' variant='ghost' onClick={() => setSelectedResult(result)}>
            상세
          </Button>
          <Button
            size='sm'
            variant='danger'
            onClick={() => {
              if (confirm('정말 삭제하시겠습니까?')) {
                deleteMutation.mutate(result.id || result.resultId || '');
              }
            }}
            disabled={deleteMutation.isPending}
          >
            삭제
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>경기 결과 | GoldenRace Admin</title>
      </Head>
      <Layout>
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>경기 결과</h1>
              <p className='mt-2 text-sm text-gray-600'>경주 결과를 조회하고 수동 등록/수정/삭제할 수 있습니다.</p>
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>결과 수동 등록</Button>
          </div>

          <Card>
            <div className='mb-4 flex gap-4'>
              <input
                type='date'
                value={
                  dateFilter && dateFilter.length >= 8
                    ? `${dateFilter.slice(0, 4)}-${dateFilter.slice(4, 6)}-${dateFilter.slice(6, 8)}`
                    : ''
                }
                onChange={(e) => setDateFilter(e.target.value.replace(/-/g, ''))}
                className='px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
              />
              {dateFilter && (
                <Button variant='ghost' onClick={() => setDateFilter('')}>
                  필터 초기화
                </Button>
              )}
            </div>

            <Table
              data={data?.data || []}
              columns={columns}
              isLoading={isLoading}
              emptyMessage='경기 결과가 없습니다.'
            />

            {data && data.meta && (
              <Pagination
                currentPage={page}
                totalPages={data.meta.totalPages}
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

              <div className='space-y-6'>
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
                            parseInt(selectedResult.rcRank) === 1
                              ? 'bg-yellow-500'
                              : parseInt(selectedResult.rcRank) === 2
                              ? 'bg-gray-400'
                              : parseInt(selectedResult.rcRank) === 3
                              ? 'bg-orange-600'
                              : 'bg-gray-300'
                          } text-white font-bold text-lg`}
                        >
                          {selectedResult.rcRank}
                        </span>
                        <span className='text-2xl font-bold'>{selectedResult.rcRank}착</span>
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
                {selectedResult.rcPrize && (
                  <div>
                    <h3 className='font-semibold text-lg mb-3'>상금</h3>
                    <div className='bg-green-50 p-4 rounded-lg'>
                      <div className='text-sm text-gray-600 mb-1'>착순 상금</div>
                      <div className='text-3xl font-bold text-green-600'>
                        {selectedResult.rcPrize.toLocaleString()}원
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
