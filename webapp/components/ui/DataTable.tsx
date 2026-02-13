/**
 * 공용 테이블 컴포넌트
 * data-table-wrapper + data-table 스타일, columns 정의로 일관된 테이블 렌더링
 */
import type { ReactNode } from 'react';

export type DataTableAlign = 'left' | 'center' | 'right';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: DataTableAlign;
  headerClassName?: string;
  cellClassName?: string | ((row: T, index: number) => string);
  render: (row: T, index: number) => ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string | number;
  compact?: boolean;
  emptyMessage?: string;
  className?: string;
  rowClassName?: (row: T, index: number) => string;
}

const alignToClass: Record<DataTableAlign, string> = {
  left: '',
  center: 'cell-center',
  right: 'cell-right',
};

export default function DataTable<T>({
  columns,
  data,
  getRowKey,
  compact = false,
  emptyMessage,
  className = '',
  rowClassName,
}: DataTableProps<T>) {
  const tableClass = compact ? 'data-table data-table-compact' : 'data-table';

  return (
    <div className={`data-table-wrapper ${className}`.trim()}>
      <table className={tableClass}>
        <thead>
          <tr>
            {columns.map((col) => {
              const alignClass = alignToClass[col.align ?? 'left'];
              const thClass = [col.headerClassName, alignClass].filter(Boolean).join(' ');
              return (
                <th key={col.key} className={thClass || undefined}>
                  {col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const key = getRowKey(row, i);
            const trClass = rowClassName?.(row, i);
            return (
              <tr key={key} className={trClass}>
                {columns.map((col) => {
                  const alignClass = alignToClass[col.align ?? 'left'];
                  const cellClass =
                    typeof col.cellClassName === 'function'
                      ? col.cellClassName(row, i)
                      : col.cellClassName;
                  const tdClass = [alignClass, cellClass].filter(Boolean).join(' ');
                  return (
                    <td key={col.key} className={tdClass || undefined}>
                      {col.render(row, i)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {data.length === 0 && emptyMessage && (
        <p className='text-text-secondary text-sm text-center py-8'>{emptyMessage}</p>
      )}
    </div>
  );
}
