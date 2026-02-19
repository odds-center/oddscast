import { ReactNode } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import type { IconName } from '../icons';

interface DataFetchStateProps {
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyIcon?: IconName;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  loadingLabel?: string;
  errorTitle?: string;
  children: ReactNode;
}

/**
 * 로딩 / 에러 / 빈 상태 / 콘텐츠 패턴 통합
 * 리스트 페이지에서 반복되는 패턴을 하나의 컴포넌트로 처리
 */
export default function DataFetchState({
  isLoading,
  error,
  onRetry,
  isEmpty = false,
  emptyIcon = 'ClipboardList',
  emptyTitle = '데이터가 없습니다',
  emptyDescription,
  emptyAction,
  loadingLabel = '불러오는 중...',
  errorTitle = '데이터를 불러오지 못했습니다',
  children,
}: DataFetchStateProps) {
  if (isLoading) {
    return (
      <div className='py-20 flex flex-col items-center justify-center'>
        <LoadingSpinner size={32} label={loadingLabel} />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon='AlertCircle'
        title={errorTitle}
        description={error.message}
        action={
          onRetry ? (
            <button onClick={onRetry} className='btn-secondary px-4 py-2 text-sm'>
              다시 시도
            </button>
          ) : undefined
        }
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return <>{children}</>;
}
