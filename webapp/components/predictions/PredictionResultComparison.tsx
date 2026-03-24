/**
 * Side-by-side view: AI predicted top 3 vs actual finishing order.
 * Shown only for COMPLETED races that have both prediction and results.
 */
import Link from 'next/link';
import Icon from '@/components/icons';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

export interface PredictedRow {
  rank: number;
  hrNo: string;
  hrName: string;
  chulNo?: string;
}

export interface ActualRow {
  ord: number;
  hrNo: string;
  hrName: string;
  chulNo?: string;
  ordType?: string | null;
}

interface PredictionResultComparisonProps {
  predictedTop: PredictedRow[];
  actualTop: ActualRow[];
  /** Optional: link builder for horse name (e.g. routes.horses.detail(hrNo)) */
  horseLink?: (hrNo: string) => string;
}

function normalizeHrNo(a: string, b: string): boolean {
  return String(a ?? '').trim() === String(b ?? '').trim();
}

export default function PredictionResultComparison({
  predictedTop,
  actualTop,
  horseLink,
}: PredictionResultComparisonProps) {
  const maxRows = Math.max(
    predictedTop.length,
    actualTop.filter((a) => !a.ordType || a.ordType === 'NORMAL').length,
  );
  if (maxRows === 0) return null;

  const hits = predictedTop.slice(0, 3).filter((pred, i) => {
    const actual = actualTop.find(
      (a) => parseInt(String(a.ord), 10) === i + 1 && (!a.ordType || a.ordType === 'NORMAL'),
    );
    return actual && normalizeHrNo(pred.hrNo, actual.hrNo);
  }).length;

  const rows: { rank: number; predicted: PredictedRow | undefined; actual: ActualRow | undefined }[] = [];
  for (let r = 1; r <= 3; r++) {
    const predicted = predictedTop.find((p) => p.rank === r);
    const actual = actualTop.find(
      (a) => parseInt(String(a.ord), 10) === r && (!a.ordType || a.ordType === 'NORMAL'),
    );
    if (predicted || actual) rows.push({ rank: r, predicted, actual });
  }

  const renderName = (hrName: string, hrNo: string, chulNo?: string) => {
    const name = hrName || hrNo || '-';
    const inner = (
      <span className="inline-flex items-center gap-1.5">
        {chulNo != null && (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-700 text-white text-[11px] font-bold shrink-0">
            {chulNo}
          </span>
        )}
        <span>{name}</span>
      </span>
    );
    if (horseLink && hrNo) {
      return (
        <Link href={horseLink(hrNo)} className="hover:text-primary hover:underline">
          {inner}
        </Link>
      );
    }
    return inner;
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-muted/10">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-b border-border bg-stone-50/80">
        <span className="text-sm font-semibold text-foreground">예측 vs 결과</span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-tight shadow-sm ${
          hits === 3
            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
            : hits >= 2
              ? 'bg-gradient-to-r from-primary to-emerald-500 text-white'
              : hits === 1
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-stone-100 text-stone-400 border border-stone-200'
        }`}>
          {hits >= 2 && <Icon name='Sparkles' size={12} />}
          {hits === 3 ? 'PERFECT' : hits >= 1 ? `${hits}/3` : 'MISS'}
        </span>
      </div>
      {/* Mobile: stacked comparison rows */}
      <div className="block sm:hidden divide-y divide-border">
        {rows.map(({ rank, predicted, actual }) => {
          const match = predicted && actual && normalizeHrNo(predicted.hrNo, actual.hrNo);
          return (
            <div key={rank} className="px-3 py-2.5 flex items-center gap-3">
              <span className="text-sm font-bold text-text-secondary w-6 shrink-0">{rank}위</span>
              <div className="flex-1 grid grid-cols-2 gap-2 text-sm min-w-0">
                <div className="min-w-0">
                  <p className="text-xs text-text-tertiary mb-0.5">AI 예측</p>
                  <div className="font-medium text-foreground truncate">
                    {predicted ? renderName(predicted.hrName, predicted.hrNo, predicted.chulNo) : <span className="text-text-tertiary">-</span>}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-text-tertiary mb-0.5">실제 결과</p>
                  <div className="font-medium text-foreground truncate">
                    {actual ? renderName(actual.hrName ?? '', actual.hrNo ?? '', actual.chulNo) : <span className="text-text-tertiary">-</span>}
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                {predicted && actual ? (
                  match ? (
                    <span className="inline-flex text-green-600" aria-label="일치"><Icon name="Check" size={16} /></span>
                  ) : (
                    <span className="inline-flex text-red-400" aria-label="불일치"><Icon name="X" size={16} /></span>
                  )
                ) : (
                  <span className="text-text-tertiary text-xs">-</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Desktop: table */}
      <div className="hidden sm:block">
        <Table className='min-w-[280px] [&_th]:py-2 [&_th]:px-3 [&_td]:py-2 [&_td]:px-3'>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead className='w-12'>순위</TableHead>
              <TableHead>AI 예측</TableHead>
              <TableHead>실제 결과</TableHead>
              <TableHead className='text-center w-14'>일치</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ rank, predicted, actual }) => {
              const match =
                predicted &&
                actual &&
                normalizeHrNo(predicted.hrNo, actual.hrNo);
              return (
                <TableRow key={rank}>
                  <TableCell className='font-medium text-foreground'>{rank}위</TableCell>
                  <TableCell className='text-foreground'>
                    {predicted
                      ? renderName(predicted.hrName, predicted.hrNo, predicted.chulNo)
                      : '-'}
                  </TableCell>
                  <TableCell className='text-foreground'>
                    {actual
                      ? renderName(actual.hrName ?? '', actual.hrNo ?? '', actual.chulNo)
                      : '-'}
                  </TableCell>
                  <TableCell className='text-center'>
                    {predicted && actual ? (
                      match ? (
                        <span className="inline-flex text-green-600" aria-label="일치">
                          <Icon name="Check" size={16} />
                        </span>
                      ) : (
                        <span className="inline-flex text-red-600" aria-label="불일치">
                          <Icon name="X" size={16} />
                        </span>
                      )
                    ) : (
                      <span className="text-text-tertiary">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
