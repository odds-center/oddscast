/**
 * Expert commentary feed — Yongsan comprehensive style
 * Speech bubble/card format, keyword highlighting
 */
import Link from 'next/link';
import type { CommentaryDto } from '@/lib/api/predictionMatrixApi';
import { routes } from '@/lib/routes';

function highlightKeywords(text: string, keywords?: string[]): React.ReactNode {
  if (!keywords?.length) return text;
  const regex = new RegExp(`(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((p, i) =>
        keywords.includes(p) ? (
          <strong key={i} className='text-stone-700 font-semibold'>
            {p}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export interface CommentaryFeedProps {
  comments: CommentaryDto[];
  locked?: boolean;
}

export default function CommentaryFeed({ comments, locked }: CommentaryFeedProps) {
  return (
    <div className='space-y-4'>
      {comments.map((c, idx) => {
        // When locked, show first 2 cards normally as preview, blur the rest
        const isBlurred = locked && idx >= 2;

        return (
          <Link
            key={c.id}
            href={locked ? '#' : routes.races.detail(c.raceId)}
            onClick={locked ? (e) => e.preventDefault() : undefined}
            className={`block rounded-xl border border-border bg-card p-4 transition-colors ${locked ? '' : 'hover:bg-muted/30'} ${isBlurred ? 'select-none pointer-events-none' : ''}`}
          >
            <div className={isBlurred ? 'blur-[6px]' : ''}>
              <div className='flex flex-wrap items-center gap-2 mb-1'>
                <span className='font-semibold text-foreground'>{c.expertName}</span>
                <span className='text-text-tertiary text-sm'>
                  {c.meet} {/^\d+$/.test(c.rcNo ?? '') ? `${c.rcNo}R` : c.rcNo ?? ''}
                </span>
              </div>
              {c.hrName && (
                <p className='text-sm text-foreground mb-1'>
                  <span className='font-medium text-stone-700'>출전 {c.hrName}</span>
                </p>
              )}
              <p className='text-text-secondary text-sm'>
                {highlightKeywords(c.comment, c.keywords)}
              </p>
            </div>
          </Link>
        );
      })}
      {comments.length === 0 && (
        <p className='text-text-secondary text-sm text-center py-12'>코멘트가 없습니다.</p>
      )}
    </div>
  );
}
