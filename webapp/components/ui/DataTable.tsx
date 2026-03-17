/**
 * Shared table component built on shadcn Table primitives
 * Consistent table rendering via column definitions
 * When getRowHref is provided, entire row is clickable for navigation
 */
import { useRouter } from 'next/router';
import type { ReactNode, MouseEvent } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils/cn';

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
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
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

  return (
    <div className={cn('rounded-[10px] border border-border bg-card overflow-hidden', className)}>
      <Table className={cn(compact && '[&_th]:py-1 [&_th]:px-2 [&_td]:py-1.5 [&_td]:px-2', 'min-w-max')}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(alignToClass[col.align ?? 'left'], col.headerClassName)}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => {
            const key = getRowKey(row, i);
            const href = getRowHref?.(row, i);
            const handleRowClick = href
              ? (e: MouseEvent<HTMLTableRowElement>) => {
                  if ((e.target as HTMLElement).closest('a')) return;
                  router.push(href);
                }
              : undefined;
            return (
              <TableRow
                key={key}
                className={cn(
                  href && 'cursor-pointer',
                  rowClassName?.(row, i),
                )}
                onClick={handleRowClick}
                onKeyDown={handleRowClick && href ? (e) => e.key === 'Enter' && router.push(href) : undefined}
                role={handleRowClick ? 'button' : undefined}
                aria-label={handleRowClick ? 'View details' : undefined}
                tabIndex={handleRowClick ? 0 : undefined}
              >
                {columns.map((col) => {
                  const cellClass =
                    typeof col.cellClassName === 'function'
                      ? col.cellClassName(row, i)
                      : col.cellClassName;
                  return (
                    <TableCell
                      key={col.key}
                      className={cn(alignToClass[col.align ?? 'left'], cellClass)}
                    >
                      {col.render(row, i)}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {data.length === 0 && emptyMessage && (
        <p className="text-text-secondary text-sm text-center py-8">{emptyMessage}</p>
      )}
    </div>
  );
}
