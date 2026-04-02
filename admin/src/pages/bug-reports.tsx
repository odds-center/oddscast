import { useState } from 'react';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { adminBugReportsApi, type BugReportItem } from '@/lib/api/admin';
import { formatDateTime, getErrorMessage } from '@/lib/utils';
import { Bug } from 'lucide-react';
import { AdminIcon } from '@/components/common/AdminIcon';

const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'OPEN', label: '접수' },
  { value: 'IN_PROGRESS', label: '처리중' },
  { value: 'RESOLVED', label: '해결됨' },
  { value: 'CLOSED', label: '닫힘' },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  UI: '화면/UI',
  PREDICTION: '예측 오류',
  PAYMENT: '결제',
  LOGIN: '로그인/인증',
  NOTIFICATION: '알림',
  OTHER: '기타',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: '접수',
  IN_PROGRESS: '처리중',
  RESOLVED: '해결됨',
  CLOSED: '닫힘',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700'>
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}

export default function BugReportsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-bug-reports', statusFilter],
    queryFn: () => adminBugReportsApi.getAll(statusFilter || undefined),
    staleTime: 30_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminBugReportsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bug-reports'] });
      toast.success('상태가 업데이트되었습니다');
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const reports: BugReportItem[] = data?.data ?? [];
  const total: number = data?.total ?? 0;

  return (
    <Layout>
      <Head>
        <title>버그 신고 | OddsCast Admin</title>
      </Head>

      <PageHeader
        title='버그 신고'
        description={`사용자가 제출한 버그 신고 목록${total ? ` (${total}건)` : ''}`}
      >
        <AdminIcon icon={Bug} className='w-6 h-6 text-amber-500' />
      </PageHeader>

      {/* Status filter */}
      <Card className='mb-4'>
        <div className='flex flex-wrap gap-2'>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                statusFilter === opt.value
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400 hover:text-primary-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className='flex justify-center py-12'>
            <LoadingSpinner size='md' label='불러오는 중...' />
          </div>
        ) : error ? (
          <div className='py-8 text-center text-red-500 text-sm'>
            {getErrorMessage(error)}
          </div>
        ) : reports.length === 0 ? (
          <div className='py-12 text-center'>
            <AdminIcon icon={Bug} className='w-10 h-10 mx-auto text-gray-300 mb-3' />
            <p className='text-sm text-gray-500'>버그 신고가 없습니다</p>
          </div>
        ) : (
          <div className='divide-y divide-gray-100'>
            {reports.map((report) => (
              <div key={report.id} className='py-4'>
                {/* Header row */}
                <div className='flex flex-wrap items-start gap-2'>
                  <CategoryBadge category={report.category} />
                  <StatusBadge status={report.status} />
                  <button
                    onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                    className='flex-1 text-left font-medium text-gray-900 text-sm hover:text-primary-600 transition-colors'
                  >
                    {report.title}
                  </button>
                  <span className='text-xs text-gray-400 shrink-0'>
                    {formatDateTime(report.createdAt)}
                  </span>
                </div>

                {/* Meta row */}
                <div className='mt-1 flex gap-3 text-xs text-gray-500'>
                  <span>
                    사용자:{' '}
                    {report.user
                      ? `${report.user.email} (${report.user.nickname ?? '-'})`
                      : report.userId
                        ? `#${report.userId}`
                        : '비로그인'}
                  </span>
                  {report.pageUrl && (
                    <span className='truncate max-w-xs'>페이지: {report.pageUrl}</span>
                  )}
                </div>

                {/* Expanded detail */}
                {expandedId === report.id && (
                  <div className='mt-3 space-y-3'>
                    <div className='bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap'>
                      {report.description}
                    </div>
                    {report.userAgent && (
                      <p className='text-xs text-gray-400 break-all'>UA: {report.userAgent}</p>
                    )}

                    {/* Status action buttons */}
                    <div className='flex flex-wrap gap-2'>
                      {report.status !== 'IN_PROGRESS' && (
                        <Button
                          size='sm'
                          variant='secondary'
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: report.id,
                              status: 'IN_PROGRESS',
                            })
                          }
                          isLoading={updateStatusMutation.isPending}
                        >
                          처리중으로 변경
                        </Button>
                      )}
                      {report.status !== 'RESOLVED' && (
                        <Button
                          size='sm'
                          variant='primary'
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: report.id,
                              status: 'RESOLVED',
                            })
                          }
                          isLoading={updateStatusMutation.isPending}
                        >
                          해결됨으로 변경
                        </Button>
                      )}
                      {report.status !== 'CLOSED' && (
                        <Button
                          size='sm'
                          variant='danger'
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: report.id,
                              status: 'CLOSED',
                            })
                          }
                          isLoading={updateStatusMutation.isPending}
                        >
                          닫기
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </Layout>
  );
}
