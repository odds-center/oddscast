/**
 * Shared table component
 * data-table-wrapper + data-table styles, consistent table rendering via column definitions
 * When getRowHref is provided, entire row is clickable for navigation
 */
import { useRouter } from 'next/router';
import type { ReactNode, MouseEvent } from 'react';

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
  /** href to navigate to when row is clicked (if provided, entire row becomes clickable) */
  getRowHref?: (row: T, index: number) => string | undefined;
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
  getRowHref,
  compact = false,
  emptyMessage,
  className = '',
  rowClassName,
}: DataTableProps<T>) {
  const router = useRouter();
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
            const href = getRowHref?.(row, i);
            const trClass = [
              rowClassName?.(row, i),
              href ? 'cursor-pointer hover:bg-stone-50' : '',
            ].filter(Boolean).join(' ');
            const handleRowClick = href
              ? (e: MouseEvent<HTMLTableRowElement>) => {
                  if ((e.target as HTMLElement).closest('a')) return;
                  router.push(href);
                }
              : undefined;
            return (
              <tr
                key={key}
                className={trClass || undefined}
                onClick={handleRowClick}
                onKeyDown={handleRowClick && href ? (e) => e.key === 'Enter' && router.push(href) : undefined}
                role={handleRowClick ? 'button' : undefined}
                aria-label={handleRowClick ? 'View details' : undefined}
                tabIndex={handleRowClick ? 0 : undefined}
              >
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
