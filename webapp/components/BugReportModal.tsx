import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getErrorMessage } from '@/lib/utils/error';
import { axiosInstance } from '@/lib/api/axios';

interface BugReportForm {
  title: string;
  description: string;
  category: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'UI', label: '화면/UI 오류' },
  { value: 'PREDICTION', label: '예측 오류' },
  { value: 'PAYMENT', label: '결제 문제' },
  { value: 'LOGIN', label: '로그인/인증' },
  { value: 'NOTIFICATION', label: '알림' },
  { value: 'OTHER', label: '기타' },
] as const;

const DESCRIPTION_TEMPLATE = `📍 버그 발생 위치: (예: 경주 상세 페이지, 결제 화면 등)

🔄 재현 방법:
1.
2.
3.

❌ 실제 결과:

✅ 기대했던 결과:`;

export default function BugReportModal({ open, onClose }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BugReportForm>({
    defaultValues: { category: 'OTHER', description: DESCRIPTION_TEMPLATE },
  });

  const mutation = useMutation({
    mutationFn: (data: BugReportForm) =>
      axiosInstance.post('/bug-reports', {
        ...data,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      }),
    onSuccess: () => {
      setSubmitted(true);
      reset();
    },
  });

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-md mx-4'>
        <DialogHeader>
          <DialogTitle className='text-base font-bold'>버그 신고</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className='py-6 text-center'>
            <div className='text-3xl mb-3'>✅</div>
            <p className='font-bold text-stone-900 mb-1'>신고가 접수되었습니다</p>
            <p className='text-sm text-stone-500'>빠르게 확인 후 수정하겠습니다.</p>
            <button
              onClick={handleClose}
              className='mt-4 px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold'
            >
              닫기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className='space-y-4'>
            <div>
              <label className='text-sm font-semibold text-stone-700 block mb-1'>분류</label>
              <select
                {...register('category')}
                className='w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white'
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='text-sm font-semibold text-stone-700 block mb-1'>제목</label>
              <input
                {...register('title', {
                  required: '제목을 입력해주세요',
                  minLength: { value: 5, message: '5자 이상 입력해주세요' },
                })}
                placeholder='버그를 한 줄로 요약해주세요'
                className='w-full border border-stone-200 rounded-lg px-3 py-2 text-sm'
              />
              {errors.title && (
                <p className='text-xs text-red-500 mt-1'>{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className='text-sm font-semibold text-stone-700 block mb-1'>상세 내용</label>
              <textarea
                {...register('description', {
                  required: '내용을 입력해주세요',
                  minLength: { value: 10, message: '10자 이상 입력해주세요' },
                })}
                rows={9}
                className='w-full border border-stone-200 rounded-lg px-3 py-2 text-sm resize-none font-mono'
              />
              {errors.description && (
                <p className='text-xs text-red-500 mt-1'>{errors.description.message}</p>
              )}
            </div>

            {mutation.error && (
              <p className='text-xs text-red-500'>{getErrorMessage(mutation.error)}</p>
            )}

            <div className='flex gap-2 pt-1'>
              <button
                type='button'
                onClick={handleClose}
                className='flex-1 py-2.5 rounded-lg border border-stone-200 text-sm font-semibold text-stone-600'
              >
                취소
              </button>
              <button
                type='submit'
                disabled={mutation.isPending}
                className='flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-50'
              >
                {mutation.isPending ? '전송 중...' : '신고하기'}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
