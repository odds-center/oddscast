import { useState } from 'react';
import Head from 'next/head';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { axiosInstance, handleApiResponse, handleApiError } from '@/lib/utils/axios';
import { formatDateTime, getErrorMessage } from '@/lib/utils';
import { RefreshCcw } from 'lucide-react';
import { AdminIcon } from '@/components/common/AdminIcon';

// ─── Types ─────────────────────────────────────────────────────────────────

interface RefundUser {
  email: string;
  nickname: string | null;
}

interface BillingHistoryRef {
  id: number;
  amount: number;
  billingDate: string;
  status: string;
}

interface RefundRequestItem {
  id: string;
  userId: number;
  user: RefundUser | null;
  type: string;
  billingHistoryId: number | null;
  billingHistory: BillingHistoryRef | null;
  subscriptionId: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  originalAmount: number;
  requestedAmount: number;
  approvedAmount: number | null;
  usedTickets: number;
  totalTickets: number;
  daysSincePayment: number;
  isEligible: boolean;
  ineligibilityReason: string | null;
  userReason: string;
  adminNote: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── API helpers (refunds live at /api/refunds, not /api/admin/refunds) ────

const REFUNDS_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchRefunds(status?: string): Promise<RefundRequestItem[]> {
  const params = status ? { status } : undefined;
  const response = await axiosInstance.get<RefundRequestItem[]>('/refunds', {
    params,
    baseURL: REFUNDS_BASE,
  });
  return handleApiResponse(response);
}

async function approveRefund(
  id: string,
  approvedAmount: number | undefined,
  adminNote: string | undefined,
): Promise<RefundRequestItem> {
  const response = await axiosInstance.patch<RefundRequestItem>(
    `/refunds/${id}/approve`,
    { approvedAmount, adminNote },
    { baseURL: REFUNDS_BASE },
  );
  return handleApiResponse(response);
}

async function rejectRefund(
  id: string,
  adminNote: string | undefined,
): Promise<RefundRequestItem> {
  const response = await axiosInstance.patch<RefundRequestItem>(
    `/refunds/${id}/reject`,
    { adminNote },
    { baseURL: REFUNDS_BASE },
  );
  return handleApiResponse(response);
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: '대기중' },
  { value: 'APPROVED', label: '승인됨' },
  { value: 'REJECTED', label: '거절됨' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  REJECTED: '거절됨',
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function EligibilityBadge({ isEligible, reason }: { isEligible: boolean; reason: string | null }) {
  return isEligible ? (
    <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700'>
      환불 가능
    </span>
  ) : (
    <span
      className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700'
      title={reason ?? ''}
    >
      환불 불가{reason ? ` — ${reason}` : ''}
    </span>
  );
}

// ─── Action panel (approve / reject) for PENDING requests ──────────────────

interface ActionPanelProps {
  request: RefundRequestItem;
  onApprove: (id: string, amount: number | undefined, note: string | undefined) => void;
  onReject: (id: string, note: string | undefined) => void;
  isLoading: boolean;
}

function ActionPanel({ request, onApprove, onReject, isLoading }: ActionPanelProps) {
  const [overrideAmount, setOverrideAmount] = useState<string>(
    String(request.requestedAmount),
  );
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<'approve' | 'reject' | null>(null);

  if (mode === 'approve') {
    return (
      <div className='mt-3 p-3 bg-green-50 rounded border border-green-200 space-y-2'>
        <p className='text-sm font-medium text-green-800'>승인 확인</p>
        <div className='flex flex-wrap gap-2 items-center'>
          <label className='text-xs text-gray-600 shrink-0'>환불 금액 (원)</label>
          <input
            type='number'
            value={overrideAmount}
            onChange={(e) => setOverrideAmount(e.target.value)}
            className='border border-gray-300 rounded px-2 py-1 text-sm w-32'
            min={0}
            max={request.originalAmount}
          />
        </div>
        <div>
          <label className='text-xs text-gray-600 block mb-1'>관리자 메모 (선택)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className='w-full border border-gray-300 rounded px-2 py-1 text-sm resize-none'
            placeholder='승인 메모...'
          />
        </div>
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='primary'
            onClick={() =>
              onApprove(
                request.id,
                overrideAmount ? Number(overrideAmount) : undefined,
                note || undefined,
              )
            }
            isLoading={isLoading}
          >
            승인 확정
          </Button>
          <Button size='sm' variant='secondary' onClick={() => setMode(null)} disabled={isLoading}>
            취소
          </Button>
        </div>
      </div>
    );
  }

  if (mode === 'reject') {
    return (
      <div className='mt-3 p-3 bg-red-50 rounded border border-red-200 space-y-2'>
        <p className='text-sm font-medium text-red-800'>거절 확인</p>
        <div>
          <label className='text-xs text-gray-600 block mb-1'>거절 사유</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className='w-full border border-gray-300 rounded px-2 py-1 text-sm resize-none'
            placeholder='거절 사유를 입력하세요...'
          />
        </div>
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='danger'
            onClick={() => onReject(request.id, note || undefined)}
            isLoading={isLoading}
          >
            거절 확정
          </Button>
          <Button size='sm' variant='secondary' onClick={() => setMode(null)} disabled={isLoading}>
            취소
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex gap-2 mt-3'>
      <Button size='sm' variant='primary' onClick={() => setMode('approve')} disabled={isLoading}>
        승인
      </Button>
      <Button size='sm' variant='danger' onClick={() => setMode('reject')} disabled={isLoading}>
        거절
      </Button>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function RefundRequestsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-refund-requests', statusFilter],
    queryFn: () => fetchRefunds(statusFilter || undefined),
    staleTime: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: ({
      id,
      amount,
      note,
    }: {
      id: string;
      amount: number | undefined;
      note: string | undefined;
    }) => approveRefund(id, amount, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refund-requests'] });
      toast.success('환불 요청이 승인되었습니다');
      setExpandedId(null);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string | undefined }) =>
      rejectRefund(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refund-requests'] });
      toast.success('환불 요청이 거절되었습니다');
      setExpandedId(null);
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const requests: RefundRequestItem[] = Array.isArray(data) ? data : [];
  const total = requests.length;

  return (
    <Layout>
      <Head>
        <title>환불 관리 | OddsCast Admin</title>
      </Head>

      <PageHeader
        title='환불 관리'
        description={`사용자 환불 요청 목록${total ? ` (${total}건)` : ''}`}
      >
        <AdminIcon icon={RefreshCcw} className='w-6 h-6 text-green-500' />
      </PageHeader>

      {/* Status filter tabs */}
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
          <div className='py-8 text-center text-red-500 text-sm'>{getErrorMessage(error)}</div>
        ) : requests.length === 0 ? (
          <div className='py-12 text-center'>
            <AdminIcon icon={RefreshCcw} className='w-10 h-10 mx-auto text-gray-300 mb-3' />
            <p className='text-sm text-gray-500'>환불 요청이 없습니다</p>
          </div>
        ) : (
          <div className='divide-y divide-gray-100'>
            {requests.map((request) => (
              <div key={request.id} className='py-4'>
                {/* Header row */}
                <div className='flex flex-wrap items-start gap-2'>
                  <StatusBadge status={request.status} />
                  <EligibilityBadge
                    isEligible={request.isEligible}
                    reason={request.ineligibilityReason}
                  />
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === request.id ? null : request.id)
                    }
                    className='flex-1 text-left font-medium text-gray-900 text-sm hover:text-primary-600 transition-colors'
                  >
                    {request.user?.email ?? `User #${request.userId}`}
                    {request.user?.nickname ? ` (${request.user.nickname})` : ''}
                  </button>
                  <span className='text-xs text-gray-400 shrink-0'>
                    {formatDateTime(request.createdAt)}
                  </span>
                </div>

                {/* Summary row */}
                <div className='mt-1 flex flex-wrap gap-3 text-xs text-gray-500'>
                  <span>
                    결제일:{' '}
                    {request.billingHistory
                      ? formatDateTime(request.billingHistory.billingDate)
                      : '-'}
                  </span>
                  <span>결제금액: {request.originalAmount.toLocaleString()}원</span>
                  <span>
                    티켓: {request.usedTickets} / {request.totalTickets} 사용
                  </span>
                  <span>결제 후 {request.daysSincePayment}일 경과</span>
                  <span className='font-semibold text-gray-700'>
                    환불 요청: {request.requestedAmount.toLocaleString()}원
                  </span>
                </div>

                {/* Expanded detail */}
                {expandedId === request.id && (
                  <div className='mt-3 space-y-3'>
                    {/* User reason */}
                    <div>
                      <p className='text-xs font-medium text-gray-500 mb-1'>환불 사유</p>
                      <div className='bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap'>
                        {request.userReason}
                      </div>
                    </div>

                    {/* Admin note / rejection reason (processed requests) */}
                    {request.adminNote && (
                      <div>
                        <p className='text-xs font-medium text-gray-500 mb-1'>관리자 메모</p>
                        <div className='bg-amber-50 rounded p-3 text-sm text-amber-800 whitespace-pre-wrap'>
                          {request.adminNote}
                        </div>
                      </div>
                    )}

                    {/* Processed info */}
                    {request.processedAt && (
                      <p className='text-xs text-gray-400'>
                        처리일시: {formatDateTime(request.processedAt)}
                        {request.approvedAmount != null && (
                          <> · 승인 금액: {request.approvedAmount.toLocaleString()}원</>
                        )}
                      </p>
                    )}

                    {/* Action buttons — only for PENDING */}
                    {request.status === 'PENDING' && (
                      <ActionPanel
                        request={request}
                        onApprove={(id, amount, note) =>
                          approveMutation.mutate({ id, amount, note })
                        }
                        onReject={(id, note) => rejectMutation.mutate({ id, note })}
                        isLoading={approveMutation.isPending || rejectMutation.isPending}
                      />
                    )}
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
