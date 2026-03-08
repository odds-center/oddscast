/**
 * Weekly Preview Report — FEATURE_ROADMAP 3.3
 * Curated summary of upcoming Fri–Sun races (Gemini-generated, cron Thu 20:00)
 */
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import SectionCard from '@/components/page/SectionCard';
import DataFetchState from '@/components/page/DataFetchState';
import WeeklyPreviewApi from '@/lib/api/weeklyPreviewApi';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { routes } from '@/lib/routes';
import Icon from '@/components/icons';
import { dayjsKST } from '@/lib/utils/dayjs';

function formatWeekLabel(weekLabel: string | null): string {
  if (!weekLabel) return '';
  const d = dayjsKST(weekLabel);
  if (!d.isValid()) return weekLabel;
  const dayOfWeek = d.day(); // 0=Sun..6=Sat
  const mon = d.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, 'day');
  const sun = mon.add(6, 'day');
  const fmt = (dt: ReturnType<typeof dayjsKST>) =>
    `${dt.month() + 1}월 ${dt.date()}일`;
  return `${fmt(mon)} ~ ${fmt(sun)}`;
}

export default function WeeklyPreviewPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['weekly-preview'],
    queryFn: () => WeeklyPreviewApi.getLatest(),
    placeholderData: keepPreviousData,
  });

  const content = data?.content;
  const weekLabel = data?.weekLabel ?? null;
  const hasContent = content && (content.highlights || (content.horsesToWatch && content.horsesToWatch.length > 0) || content.trackConditions);

  return (
    <Layout title='주간 프리뷰 | OddsCast' description='이번 주 주요 경주 프리뷰와 AI 분석 하이라이트.'>
      <CompactPageTitle title='주간 프리뷰' backHref={routes.home} />
      <p className='text-sm text-text-secondary mb-4'>
        이번 주말(금·토·일) 경주 요약과 주목할 포인트입니다. 매주 목요일 저녁에 자동 생성됩니다.
      </p>
      <DataFetchState
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!hasContent && !isLoading}
        emptyIcon='Calendar'
        emptyTitle='아직 프리뷰가 없습니다'
        emptyDescription='목요일 저녁에 이번 주말 경주 요약이 생성됩니다.'
        loadingLabel='불러오는 중...'
      >
        {hasContent && content && (
          <div className='space-y-5'>
            {weekLabel && (
              <p className='text-sm text-text-tertiary'>
                {formatWeekLabel(weekLabel)} 주
              </p>
            )}
            {content.highlights && (
              <SectionCard
                title='이번 주 하이라이트'
                icon='Sparkles'
                description='주말 주요 경주 요약'
              >
                <p className='text-foreground leading-relaxed whitespace-pre-line'>
                  {content.highlights}
                </p>
              </SectionCard>
            )}
            {content.horsesToWatch && content.horsesToWatch.length > 0 && (
              <SectionCard
                title='주목할 말'
                icon='Flag'
                description='이번 주말 관전 포인트'
              >
                <ul className='space-y-2'>
                  {content.horsesToWatch.map((item, i) => (
                    <li
                      key={i}
                      className='flex items-start gap-2 text-foreground'
                    >
                      <Icon name='Star' size={16} className='shrink-0 mt-0.5 text-primary' />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}
            {content.trackConditions && content.trackConditions !== '—' && (
              <SectionCard
                title='트랙·날씨'
                icon='Calendar'
                description='예상 마장·날씨'
              >
                <p className='text-foreground leading-relaxed'>
                  {content.trackConditions}
                </p>
              </SectionCard>
            )}
          </div>
        )}
      </DataFetchState>
    </Layout>
  );
}
