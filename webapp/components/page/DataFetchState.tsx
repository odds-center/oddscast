import { ReactNode } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import EmptyState from '../EmptyState';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/utils/error';
import type { IconName } from '../icons';

interface DataFetchStateProps {
  isLoading: boolean;
  error: unknown;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyIcon?: IconName;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  loadingLabel?: string;
  errorTitle?: string;
  errorDescription?: string;
  children: ReactNode;
}

/**
 * Unified loading / error / empty state / content pattern
 * Handles repetitive patterns in list pages as a single component
 */
export default function DataFetchState({
  isLoading,
  error,
  onRetry,
  isEmpty = false,
  emptyIcon = 'ClipboardList',
  emptyTitle = '표시할 내용이 없습니다',
  emptyDescription,
  emptyAction,
  loadingLabel = '준비 중...',
  errorTitle = '일시적인 오류가 발생했습니다',
  errorDescription,
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
        description={errorDescription ?? getErrorMessage(error)}
        action={
          onRetry ? (
            <Button onClick={onRetry} variant='outline' size='sm' aria-label='다시 시도'>
              다시 시도
            </Button>
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
