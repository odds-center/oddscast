/**
 * Side-by-side view: AI predicted top 3 vs actual finishing order.
 * Shown only for COMPLETED races that have both prediction and results.
 */
import Link from 'next/link';
import Icon from '@/components/icons';
import { Badge } from '@/components/ui';

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
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-700 text-white text-[10px] font-bold shrink-0">
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
        <Badge variant={hits === 3 ? 'success' : hits >= 1 ? 'primary' : 'error'} size="sm">
          이 경주 적중: {hits}/3
        </Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="text-left py-2 px-3 w-12 font-medium">순위</th>
              <th className="text-left py-2 px-3 font-medium">AI 예측</th>
              <th className="text-left py-2 px-3 font-medium">실제 결과</th>
              <th className="cell-center py-2 px-3 w-14 font-medium">일치</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ rank, predicted, actual }) => {
              const match =
                predicted &&
                actual &&
                normalizeHrNo(predicted.hrNo, actual.hrNo);
              return (
                <tr key={rank} className="border-b border-border last:border-0">
                  <td className="py-2 px-3 font-medium text-foreground">{rank}위</td>
                  <td className="py-2 px-3 text-foreground">
                    {predicted
                      ? renderName(predicted.hrName, predicted.hrNo, predicted.chulNo)
                      : '-'}
                  </td>
                  <td className="py-2 px-3 text-foreground">
                    {actual
                      ? renderName(actual.hrName ?? '', actual.hrNo ?? '', actual.chulNo)
                      : '-'}
                  </td>
                  <td className="cell-center py-2 px-3">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
