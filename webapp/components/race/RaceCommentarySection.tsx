import Icon from '@/components/icons';
import { SectionTitle } from '@/components/ui';

export interface RaceCommentaryBlock {
  headline: string;
  commentary: string;
  keyPoints: string[];
  mood: 'exciting' | 'normal' | 'upset';
  generatedAt?: string;
}

export interface RaceCommentary {
  preRace?: RaceCommentaryBlock;
  postRace?: RaceCommentaryBlock;
}

interface Props {
  commentary: RaceCommentary | null | undefined;
  isCompleted: boolean;
}

const moodConfig = {
  exciting: { label: '흥미진진', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  upset:    { label: '이변', color: 'text-rose-600',  bg: 'bg-rose-50',  border: 'border-rose-200'  },
  normal:   { label: '평이',   color: 'text-stone-500', bg: 'bg-stone-50', border: 'border-stone-200' },
} as const;

function CommentaryBlock({ block, type }: { block: RaceCommentaryBlock; type: 'pre' | 'post' }) {
  const mood = moodConfig[block.mood] ?? moodConfig.normal;
  const isPost = type === 'post';

  return (
    <div className={`rounded-xl border ${mood.border} ${mood.bg} p-4 space-y-3`}>
      {/* Header */}
      <div className='flex items-start justify-between gap-2'>
        <div className='flex items-center gap-1.5'>
          <Icon
            name={isPost ? 'Mic2' : 'Eye'}
            size={14}
            className={mood.color}
          />
          <span className={`text-xs font-semibold ${mood.color}`}>
            {isPost ? '경주 후 해설' : '경주 전 관전 포인트'}
          </span>
        </div>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${mood.border} ${mood.color} bg-white/70`}>
          {mood.label}
        </span>
      </div>

      {/* Headline */}
      <p className='text-sm font-bold text-foreground leading-snug'>{block.headline}</p>

      {/* Commentary */}
      <p className='text-sm text-foreground/80 leading-relaxed'>{block.commentary}</p>

      {/* Key points */}
      {block.keyPoints.length > 0 && (
        <ul className='space-y-1.5'>
          {block.keyPoints.map((point, i) => (
            <li key={i} className='flex items-start gap-2'>
              <span className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                isPost ? 'bg-primary' : 'bg-amber-500'
              }`}>
                {i + 1}
              </span>
              <span className='text-xs text-foreground/70 leading-relaxed'>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function RaceCommentarySection({ commentary, isCompleted }: Props) {
  if (!commentary) return null;

  const hasPreRace = !!commentary.preRace;
  const hasPostRace = !!commentary.postRace;

  if (!hasPreRace && !hasPostRace) return null;

  return (
    <section>
      <SectionTitle
        title='AI 경주 해설'
        icon='Mic2'
        badge='GEMINI'
        className='mb-2'
      />
      <div className='space-y-3'>
        {/* Post-race commentary shown first when race is complete */}
        {isCompleted && hasPostRace && (
          <CommentaryBlock block={commentary.postRace!} type='post' />
        )}

        {/* Pre-race watch points */}
        {hasPreRace && (
          <CommentaryBlock block={commentary.preRace!} type='pre' />
        )}

        <p className='text-[11px] text-text-tertiary px-1 leading-relaxed'>
          AI가 경주 데이터를 분석해 생성한 해설입니다. 참고 자료로만 활용하세요.
        </p>
      </div>
    </section>
  );
}
