/**
 * Advanced Analytics Dashboard — /analytics
 * Public sections: track condition stats, AI prediction accuracy by meet
 * Auth-gated sections: post position advantage, jockey-trainer combos, distance win rates
 */
import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import Link from 'next/link';
import Layout from '@/components/Layout';
import CompactPageTitle from '@/components/page/CompactPageTitle';
import SectionCard from '@/components/page/SectionCard';
import DataFetchState from '@/components/page/DataFetchState';
import { DataTable } from '@/components/ui';
import TabBar from '@/components/ui/TabBar';
import Icon from '@/components/icons';
import { useAuthStore } from '@/lib/store/authStore';
import { routes } from '@/lib/routes';
import AnalyticsApi, {
  type MeetCode,
  type PostPositionStat,
  type TrackConditionStat,
  type JockeyTrainerCombo,
  type PredictionAccuracyByMeet,
  type DistanceWinRate,
} from '@/lib/api/analyticsApi';

// --- Constants ---

const MEET_OPTIONS: { value: MeetCode; label: string }[] = [
  { value: '서울', label: '서울' },
  { value: '제주', label: '제주' },
  { value: '부산경남', label: '부산경남' },
];

// --- Sub-components ---

/** CSS bar chart — renders a horizontal bar for a given percentage value */
function HBar({
  pct,
  colorClass = 'bg-primary',
  label,
}: {
  pct: number;
  colorClass?: string;
  label?: string;
}) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className='flex items-center gap-2 w-full'>
      <div className='flex-1 h-2 rounded-full bg-stone-100 overflow-hidden'>
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {label !== undefined && (
        <span className='text-xs tabular-nums text-text-secondary shrink-0 w-10 text-right'>
          {label}
        </span>
      )}
    </div>
  );
}

/** Vertical CSS bar chart — renders columns of equal width */
function VBarChart({
  bars,
  maxValue,
  heightPx = 96,
}: {
  bars: { label: string; value: number; tooltip?: string }[];
  maxValue: number;
  heightPx?: number;
}) {
  const safeMax = maxValue > 0 ? maxValue : 1;
  return (
    <div
      className='flex items-end gap-1'
      style={{ height: heightPx }}
      aria-label='막대 그래프'
    >
      {bars.map((bar) => {
        const pct = (bar.value / safeMax) * (heightPx - 18); // leave 18px for label
        const isHigh = bar.value >= safeMax * 0.6;
        return (
          <div
            key={bar.label}
            className='flex-1 min-w-0 flex flex-col items-center justify-end gap-0.5 h-full'
            title={bar.tooltip ?? `${bar.label}: ${bar.value}%`}
          >
            <div
              className={`w-full rounded-t min-h-[4px] transition-all duration-500 ${isHigh ? 'bg-primary' : 'bg-primary/50'}`}
              style={{ height: `${Math.max(4, pct)}px` }}
            />
            <span className='text-[10px] text-text-tertiary truncate w-full text-center shrink-0 leading-tight'>
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Auth-gated section — shows a locked card when user is not logged in */
function LockedSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className='rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 flex flex-col items-center text-center gap-3'>
      <div className='w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center'>
        <Icon name='Lock' size={22} className='text-stone-400' />
      </div>
      <div>
        <p className='text-sm font-semibold text-foreground'>{title}</p>
        <p className='text-xs text-text-secondary mt-1 leading-relaxed'>{description}</p>
      </div>
      <Link
        href={routes.auth.login}
        className='btn-primary mt-1 text-sm px-5 py-2.5 rounded-xl font-semibold inline-flex items-center gap-1.5'
      >
        <Icon name='LogIn' size={15} />
        로그인하기
      </Link>
    </div>
  );
}

// --- Section components ---

function PostPositionSection({ meet, isLoggedIn }: { meet: MeetCode; isLoggedIn: boolean }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics', 'post-position', meet],
    queryFn: () => AnalyticsApi.getPostPosition(meet),
    placeholderData: keepPreviousData,
    enabled: isLoggedIn,
  });

  if (!isLoggedIn) {
    return (
      <SectionCard title='출발 번호별 승률' icon='Hash' className='mb-6'>
        <LockedSection
          title='로그인이 필요한 기능입니다'
          description={'출발 번호(게이트)별 우승 확률을 확인하려면\n로그인이 필요합니다.'}
        />
      </SectionCard>
    );
  }

  const stats: PostPositionStat[] = data?.stats ?? [];
  const maxWinRate = stats.reduce((m, s) => Math.max(m, s.winRate), 0);

  return (
    <SectionCard
      title='출발 번호별 승률'
      icon='Hash'
      description='게이트 번호 기준 1착 비율'
      className='mb-6'
    >
      <DataFetchState
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!isLoading && stats.length === 0}
        emptyIcon='Hash'
        emptyTitle='데이터가 없습니다'
        emptyDescription='해당 경마장의 출발 번호 통계가 없습니다.'
        loadingLabel='데이터 불러오는 중...'
      >
        {stats.length > 0 && (
          <>
            {/* Vertical bar chart */}
            <div className='mb-4 rounded-xl border border-border bg-stone-50/50 p-4'>
              <p className='text-xs text-text-tertiary font-semibold mb-3'>출발 번호별 승률 (%)</p>
              <VBarChart
                bars={stats.map((s) => ({
                  label: String(s.chulNo),
                  value: s.winRate,
                  tooltip: `${s.chulNo}번: ${s.winRate}% (${s.wins}/${s.totalStarts})`,
                }))}
                maxValue={maxWinRate}
                heightPx={100}
              />
            </div>
            {/* Desktop table */}
            <div className='hidden sm:block'>
              <DataTable<PostPositionStat>
                columns={[
                  {
                    key: 'chulNo',
                    header: '번호',
                    headerClassName: 'w-16',
                    render: (r) => (
                      <span className='inline-flex items-center justify-center w-7 h-7 rounded-full bg-stone-800 text-white text-xs font-bold tabular-nums'>
                        {r.chulNo}
                      </span>
                    ),
                  },
                  {
                    key: 'totalStarts',
                    header: '출전',
                    align: 'right',
                    headerClassName: 'w-20',
                    render: (r) => r.totalStarts.toLocaleString(),
                  },
                  {
                    key: 'wins',
                    header: '1착',
                    align: 'right',
                    headerClassName: 'w-20',
                    render: (r) => r.wins.toLocaleString(),
                  },
                  {
                    key: 'winRate',
                    header: '승률',
                    headerClassName: 'min-w-[120px]',
                    render: (r) => (
                      <div className='flex items-center gap-2'>
                        <HBar pct={r.winRate} label={`${r.winRate}%`} />
                      </div>
                    ),
                  },
                ]}
                data={stats}
                getRowKey={(r) => String(r.chulNo)}
                compact
              />
            </div>
            {/* Mobile rows */}
            <div className='block sm:hidden divide-y divide-border rounded-xl border border-border overflow-hidden'>
              {stats.map((s) => (
                <div key={s.chulNo} className='flex items-center gap-3 py-2.5 px-3 bg-card'>
                  <span className='inline-flex items-center justify-center w-7 h-7 rounded-full bg-stone-800 text-white text-xs font-bold tabular-nums shrink-0'>
                    {s.chulNo}
                  </span>
                  <HBar pct={s.winRate} />
                  <span className='text-sm font-semibold tabular-nums text-primary shrink-0 w-12 text-right'>
                    {s.winRate}%
                  </span>
                  <span className='text-xs text-text-secondary tabular-nums shrink-0'>
                    {s.wins}/{s.totalStarts}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </DataFetchState>
    </SectionCard>
  );
}

function TrackConditionSection({ meet }: { meet: MeetCode }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics', 'track-condition', meet],
    queryFn: () => AnalyticsApi.getTrackCondition(meet),
    placeholderData: keepPreviousData,
  });

  const stats: TrackConditionStat[] = data?.stats ?? [];

  return (
    <SectionCard
      title='주로 상태별 승률'
      icon='Droplets'
      description='주로(트랙) 상태에 따른 1착 비율'
      className='mb-6'
    >
      <DataFetchState
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!isLoading && stats.length === 0}
        emptyIcon='Droplets'
        emptyTitle='데이터가 없습니다'
        emptyDescription='해당 경마장의 주로 상태 통계가 없습니다.'
        loadingLabel='데이터 불러오는 중...'
      >
        {stats.length > 0 && (
          <>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4'>
              {stats.map((s) => {
                const isGood = s.winRate >= 20;
                return (
                  <div
                    key={s.condition}
                    className='rounded-xl border border-border bg-background p-4 text-center'
                  >
                    <p className='text-xs text-text-tertiary mb-1'>{s.conditionLabel}</p>
                    <p
                      className={`text-2xl font-bold tabular-nums ${isGood ? 'text-emerald-600' : 'text-foreground'}`}
                    >
                      {s.winRate}%
                    </p>
                    <p className='text-[11px] text-text-tertiary mt-1'>
                      {s.wins.toLocaleString()}/{s.totalStarts.toLocaleString()}건
                    </p>
                    <div className='mt-2 h-1.5 rounded-full bg-stone-100 overflow-hidden'>
                      <div
                        className={`h-full rounded-full transition-all ${isGood ? 'bg-emerald-500' : 'bg-stone-400'}`}
                        style={{ width: `${Math.min(100, s.winRate * 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className='hidden sm:block'>
              <DataTable<TrackConditionStat>
                columns={[
                  {
                    key: 'conditionLabel',
                    header: '주로 상태',
                    headerClassName: 'min-w-[90px]',
                    render: (r) => r.conditionLabel,
                  },
                  {
                    key: 'totalStarts',
                    header: '출전',
                    align: 'right',
                    headerClassName: 'w-24',
                    render: (r) => r.totalStarts.toLocaleString(),
                  },
                  {
                    key: 'wins',
                    header: '1착',
                    align: 'right',
                    headerClassName: 'w-20',
                    render: (r) => r.wins.toLocaleString(),
                  },
                  {
                    key: 'winRate',
                    header: '승률',
                    align: 'right',
                    headerClassName: 'w-24',
                    render: (r) => `${r.winRate}%`,
                  },
                ]}
                data={stats}
                getRowKey={(r) => r.condition}
                compact
              />
            </div>
          </>
        )}
      </DataFetchState>
    </SectionCard>
  );
}

function JockeyTrainerSection({ meet, isLoggedIn }: { meet: MeetCode; isLoggedIn: boolean }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics', 'jockey-trainer-combos', meet],
    queryFn: () => AnalyticsApi.getJockeyTrainerCombos(meet),
    placeholderData: keepPreviousData,
    enabled: isLoggedIn,
  });

  if (!isLoggedIn) {
    return (
      <SectionCard title='기수·조교사 조합 Top 10' icon='Users' className='mb-6'>
        <LockedSection
          title='로그인이 필요한 기능입니다'
          description={'기수-조교사 조합별 승률 Top 10을\n확인하려면 로그인이 필요합니다.'}
        />
      </SectionCard>
    );
  }

  const combos: JockeyTrainerCombo[] = data?.combos ?? [];
  const maxWinRate = combos.reduce((m, c) => Math.max(m, c.winRate), 0);

  return (
    <SectionCard
      title='기수·조교사 조합 Top 10'
      icon='Users'
      description='최소 10회 이상 출전 기준, 승률 상위 10개 조합'
      className='mb-6'
    >
      <DataFetchState
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!isLoading && combos.length === 0}
        emptyIcon='Users'
        emptyTitle='데이터가 없습니다'
        emptyDescription='충분한 출전 횟수가 쌓이면 조합 통계가 표시됩니다.'
        loadingLabel='데이터 불러오는 중...'
      >
        {combos.length > 0 && (
          <>
            {/* Mobile rows */}
            <div className='block sm:hidden divide-y divide-border rounded-xl border border-border overflow-hidden mb-0'>
              {combos.map((c, i) => (
                <div key={`${c.jockeyName}-${c.trainerName}`} className='flex items-center gap-3 py-2.5 px-3 bg-card'>
                  <span className='text-xs tabular-nums text-text-tertiary shrink-0 w-5 text-right font-medium'>
                    {i + 1}
                  </span>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-semibold text-foreground truncate'>{c.jockeyName}</p>
                    <p className='text-xs text-text-secondary truncate'>{c.trainerName} 조교사</p>
                  </div>
                  <div className='text-right shrink-0'>
                    <p className='text-sm font-bold tabular-nums text-primary'>{c.winRate}%</p>
                    <p className='text-[11px] text-text-tertiary tabular-nums'>{c.wins}/{c.totalStarts}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className='hidden sm:block'>
              <DataTable<JockeyTrainerCombo & { rank: number }>
                columns={[
                  {
                    key: 'rank',
                    header: '순위',
                    headerClassName: 'w-12',
                    render: (r) => <span className='text-xs text-text-secondary tabular-nums'>{r.rank}</span>,
                  },
                  {
                    key: 'jockeyName',
                    header: '기수',
                    headerClassName: 'min-w-[80px]',
                    render: (r) => <span className='font-semibold'>{r.jockeyName}</span>,
                  },
                  {
                    key: 'trainerName',
                    header: '조교사',
                    headerClassName: 'min-w-[80px]',
                    render: (r) => r.trainerName,
                  },
                  {
                    key: 'totalStarts',
                    header: '출전',
                    align: 'right',
                    headerClassName: 'w-20',
                    render: (r) => r.totalStarts.toLocaleString(),
                  },
                  {
                    key: 'wins',
                    header: '1착',
                    align: 'right',
                    headerClassName: 'w-20',
                    render: (r) => r.wins.toLocaleString(),
                  },
                  {
                    key: 'winRate',
                    header: '승률',
                    headerClassName: 'min-w-[120px]',
                    render: (r) => (
                      <HBar
                        pct={(r.winRate / (maxWinRate || 1)) * 100}
                        colorClass={r.winRate >= maxWinRate * 0.7 ? 'bg-primary' : 'bg-primary/60'}
                        label={`${r.winRate}%`}
                      />
                    ),
                  },
                ]}
                data={combos.map((c, i) => ({ ...c, rank: i + 1 }))}
                getRowKey={(r) => `${r.jockeyName}-${r.trainerName}`}
                compact
              />
            </div>
          </>
        )}
      </DataFetchState>
    </SectionCard>
  );
}

function PredictionAccuracySection({ meet }: { meet: MeetCode }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics', 'prediction-accuracy', meet],
    queryFn: () => AnalyticsApi.getPredictionAccuracy(meet),
    placeholderData: keepPreviousData,
  });

  const byMeet: PredictionAccuracyByMeet[] = data?.byMeet ?? [];
  const maxAccuracy = byMeet.reduce((m, r) => Math.max(m, r.accuracy), 0);

  return (
    <SectionCard
      title='경마장별 AI 예측 정확도'
      icon='Target'
      description='완료된 예측 기준 적중률'
      className='mb-6'
    >
      <DataFetchState
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!isLoading && byMeet.length === 0}
        emptyIcon='Target'
        emptyTitle='데이터가 없습니다'
        emptyDescription='완료된 예측이 쌓이면 경마장별 통계가 표시됩니다.'
        loadingLabel='데이터 불러오는 중...'
      >
        {byMeet.length > 0 && (
          <>
            {/* Bar chart */}
            <div className='mb-4 rounded-xl border border-border bg-stone-50/50 p-4'>
              <p className='text-xs text-text-tertiary font-semibold mb-3'>경마장별 적중률</p>
              <VBarChart
                bars={byMeet.map((r) => ({
                  label: r.meetLabel,
                  value: r.accuracy,
                  tooltip: `${r.meetLabel}: ${r.accuracy}% (${r.hitCount}/${r.totalPredictions})`,
                }))}
                maxValue={maxAccuracy}
                heightPx={96}
              />
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              {byMeet.map((r) => (
                <div key={r.meet} className='rounded-xl border border-border bg-background p-4'>
                  <p className='text-xs text-text-tertiary mb-0.5'>{r.meetLabel}</p>
                  <p className='text-xl font-semibold tabular-nums'>
                    {r.accuracy}
                    <span className='text-sm font-normal text-text-secondary ml-0.5'>%</span>
                  </p>
                  <p className='text-xs text-text-tertiary mt-1 tabular-nums'>
                    {r.hitCount.toLocaleString()}/{r.totalPredictions.toLocaleString()}건
                  </p>
                  <div className='mt-2 h-1.5 rounded-full bg-stone-100 overflow-hidden'>
                    <div
                      className='h-full rounded-full bg-amber-500 transition-all'
                      style={{ width: `${Math.min(100, r.accuracy)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </DataFetchState>
    </SectionCard>
  );
}

function DistanceWinRateSection({ meet, isLoggedIn }: { meet: MeetCode; isLoggedIn: boolean }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics', 'distance-win-rates', meet],
    queryFn: () => AnalyticsApi.getDistanceWinRates(meet),
    placeholderData: keepPreviousData,
    enabled: isLoggedIn,
  });

  if (!isLoggedIn) {
    return (
      <SectionCard title='거리별 승률' icon='Ruler' className='mb-6'>
        <LockedSection
          title='로그인이 필요한 기능입니다'
          description={'거리 구간별 승률 분석을 확인하려면\n로그인이 필요합니다.'}
        />
      </SectionCard>
    );
  }

  const stats: DistanceWinRate[] = data?.stats ?? [];
  const maxWinRate = stats.reduce((m, s) => Math.max(m, s.winRate), 0);

  return (
    <SectionCard
      title='거리별 승률'
      icon='Ruler'
      description='거리 구간별 1착 비율'
      className='mb-6'
    >
      <DataFetchState
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!isLoading && stats.length === 0}
        emptyIcon='Ruler'
        emptyTitle='데이터가 없습니다'
        emptyDescription='해당 경마장의 거리별 통계가 없습니다.'
        loadingLabel='데이터 불러오는 중...'
      >
        {stats.length > 0 && (
          <>
            {/* Vertical bar chart */}
            <div className='mb-4 rounded-xl border border-border bg-stone-50/50 p-4'>
              <p className='text-xs text-text-tertiary font-semibold mb-3'>거리 구간별 승률 (%)</p>
              <VBarChart
                bars={stats.map((s) => ({
                  label: s.rangeLabel.replace('m', ''),
                  value: s.winRate,
                  tooltip: `${s.rangeLabel}: ${s.winRate}% (${s.wins}/${s.totalStarts})`,
                }))}
                maxValue={maxWinRate}
                heightPx={100}
              />
            </div>
            {/* Mobile rows */}
            <div className='block sm:hidden divide-y divide-border rounded-xl border border-border overflow-hidden'>
              {stats.map((s) => (
                <div key={s.rangeLabel} className='flex items-center gap-3 py-2.5 px-3 bg-card'>
                  <span className='text-xs font-medium text-foreground shrink-0 w-24'>{s.rangeLabel}</span>
                  <HBar pct={s.winRate} />
                  <span className='text-sm font-semibold tabular-nums text-primary shrink-0 w-12 text-right'>
                    {s.winRate}%
                  </span>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className='hidden sm:block'>
              <DataTable<DistanceWinRate>
                columns={[
                  {
                    key: 'rangeLabel',
                    header: '거리 구간',
                    headerClassName: 'min-w-[110px]',
                    render: (r) => r.rangeLabel,
                  },
                  {
                    key: 'totalStarts',
                    header: '출전',
                    align: 'right',
                    headerClassName: 'w-24',
                    render: (r) => r.totalStarts.toLocaleString(),
                  },
                  {
                    key: 'wins',
                    header: '1착',
                    align: 'right',
                    headerClassName: 'w-20',
                    render: (r) => r.wins.toLocaleString(),
                  },
                  {
                    key: 'winRate',
                    header: '승률',
                    headerClassName: 'min-w-[120px]',
                    render: (r) => (
                      <HBar
                        pct={(r.winRate / (maxWinRate || 1)) * 100}
                        colorClass={r.winRate >= maxWinRate * 0.7 ? 'bg-primary' : 'bg-primary/60'}
                        label={`${r.winRate}%`}
                      />
                    ),
                  },
                ]}
                data={stats}
                getRowKey={(r) => r.rangeLabel}
                compact
              />
            </div>
          </>
        )}
      </DataFetchState>
    </SectionCard>
  );
}

// --- Page ---

export default function AnalyticsDashboardPage() {
  const { isLoggedIn } = useAuthStore();
  const [meet, setMeet] = useState<MeetCode>('서울');

  return (
    <Layout
      title='고급 분석 | OddsCast'
      description='경마장별 출발 번호 우위, 주로 상태, 기수-조교사 조합, 거리별 승률, AI 예측 정확도 분석 대시보드.'
    >
      <CompactPageTitle title='고급 분석' backHref={routes.home} />

      <p className='text-sm text-text-secondary mb-4'>
        경마장별 통계 데이터와 AI 예측 분석을 확인하세요.
        {!isLoggedIn && (
          <span className='text-amber-600 font-medium ml-1'>일부 항목은 로그인 후 이용 가능합니다.</span>
        )}
      </p>

      {/* Meet filter tabs */}
      <TabBar<MeetCode>
        options={MEET_OPTIONS}
        value={meet}
        onChange={setMeet}
        variant='subtle'
        size='sm'
        className='mb-6 w-full'
      />

      {/* Public: Track condition stats */}
      <TrackConditionSection meet={meet} />

      {/* Public: AI prediction accuracy by meet */}
      <PredictionAccuracySection meet={meet} />

      {/* Auth-gated: Post position advantage */}
      <PostPositionSection meet={meet} isLoggedIn={isLoggedIn} />

      {/* Auth-gated: Jockey-trainer combos */}
      <JockeyTrainerSection meet={meet} isLoggedIn={isLoggedIn} />

      {/* Auth-gated: Distance win rates */}
      <DistanceWinRateSection meet={meet} isLoggedIn={isLoggedIn} />
    </Layout>
  );
}
