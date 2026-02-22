import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  /** 행 고유 키 (없으면 index 사용) */
  getRowKey?: (item: T, index: number) => string | number;
  /** 행 클릭 시 호출 (버튼/링크는 내부에서 stopPropagation 권장) */
  onRowClick?: (item: T, index: number) => void;
}

export default function Table<T extends object>({
  data,
  columns,
  isLoading = false,
  emptyMessage = '데이터가 없습니다.',
  getRowKey,
  onRowClick,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <LoadingSpinner size='md' />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className='text-center py-8'>
        <p className='text-gray-500'>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='bg-gray-50'>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {data.map((item, index) => (
            <tr
              key={getRowKey ? getRowKey(item, index) : index}
              className={cn('hover:bg-gray-50', onRowClick && 'cursor-pointer')}
              onClick={onRowClick ? () => onRowClick(item, index) : undefined}
              role={onRowClick ? 'button' : undefined}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn('px-4 py-2.5 whitespace-nowrap text-sm', column.className)}
                >
                  {column.render ? column.render(item) : (item as Record<string, ReactNode>)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
