/**
 * 전문가 코멘트 피드 — 용산종합지 스타일
 * 말풍선/카드 형태, 키워드 강조, 게이트 배지
 */
import Link from 'next/link';
import type { CommentaryDto } from '@/lib/api/predictionMatrixApi';
import { getGateBgColor } from '@/components/race/RaceHeaderCard';
import { routes } from '@/lib/routes';

function highlightKeywords(text: string, keywords?: string[]): React.ReactNode {
  if (!keywords?.length) return text;
  const regex = new RegExp(`(${keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((p, i) =>
        keywords.includes(p) ? (
          <strong key={i} className='text-primary font-semibold'>
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
}

export default function CommentaryFeed({ comments }: CommentaryFeedProps) {
  return (
    <div className='space-y-4'>
      {comments.map((c) => {
        const gateNo = parseInt(c.hrNo, 10) || 0;
        const bgColor = getGateBgColor(gateNo);
        const isLight = ['#ffffff', '#fde047', '#facc15', '#38bdf8', '#84cc16'].includes(bgColor);

        return (
          <Link
            key={c.id}
            href={routes.races.detail(c.raceId)}
            className='block rounded-xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors'
          >
            <div className='flex items-start gap-3'>
              <span
                className='shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm'
                style={{
                  backgroundColor: bgColor,
                  color: isLight ? '#171717' : '#fff',
                  border: isLight ? '1px solid #e5e7eb' : 'none',
                }}
              >
                {c.hrNo}
              </span>
              <div className='flex-1 min-w-0'>
                <div className='flex flex-wrap items-center gap-2 mb-1'>
                  <span className='font-semibold text-foreground'>{c.expertName}</span>
                  <span className='text-text-tertiary text-sm'>
                    {c.meet} {c.rcNo}
                  </span>
                </div>
                <p className='text-sm text-foreground mb-1'>
                  <span className='font-medium text-primary'>{c.hrNo}번 {c.hrName}</span>
                </p>
                <p className='text-text-secondary text-sm'>
                  {highlightKeywords(c.comment, c.keywords)}
                </p>
              </div>
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
