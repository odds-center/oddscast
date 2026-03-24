/**
 * Your recent races — races recently viewed on this device (FEATURE_ROADMAP 5.2)
 * Uses localStorage; no server-side tracking.
 * Initial state is always [] so server and client first paint match (avoids hydration error).
 */
import { useState, useEffect } from 'react';
import { useQueries, keepPreviousData } from '@tanstack/react-query';
import Link from 'next/link';
import RaceApi from '@/lib/api/raceApi';
import { getRecentRaceIds } from '@/lib/utils/recentRaces';
import { formatRcDate } from '@/lib/utils/format';
import HomeSection from './HomeSection';
import { routes } from '@/lib/routes';

const MAX_DISPLAY = 5;

export default function RecentRacesSection() {
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    // Read localStorage after mount to avoid SSR hydration mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentIds(getRecentRaceIds().slice(0, MAX_DISPLAY));
  }, []);

  const queries = useQueries({
    queries: recentIds.map((raceId) => ({
      queryKey: ['race', raceId],
      queryFn: () => RaceApi.getRace(raceId),
      enabled: !!raceId,
      placeholderData: keepPreviousData,
    })),
  });

  const races = queries
    .map((q, i) => ({ id: recentIds[i], data: q.data }))
    .filter((x): x is { id: string; data: NonNullable<typeof x.data> } => x.data != null && !!x.id)
    .map(({ id, data }) => ({
      id,
      meetName: (data as { meetName?: string }).meetName ?? '-',
      rcNo: (data as { rcNo?: string }).rcNo ?? '-',
      rcDate: (data as { rcDate?: string }).rcDate ?? '',
    }));

  if (recentIds.length === 0) return null;

  return (
    <HomeSection
      title="최근 본 경주"
      icon="Clock"
      viewAllHref={routes.races.list}
      viewAllLabel="전체 경주"
      badge={races.length > 0 ? `${races.length}경주` : undefined}
    >
      {races.length === 0 ? (
        <p className="text-sm text-text-secondary">불러오는 중...</p>
      ) : (
        <div className="divide-y divide-border/60">
          {races.map((race) => (
            <Link
              key={race.id}
              href={routes.races.detail(race.id)}
              className="flex items-center py-2 text-sm hover:bg-muted/10 transition-colors gap-3"
            >
              <span className="font-medium text-foreground shrink-0 w-16">{race.meetName}</span>
              <span className="text-foreground tabular-nums shrink-0 w-8">{race.rcNo}R</span>
              {race.rcDate && (
                <span className="text-text-tertiary text-xs tabular-nums">{formatRcDate(race.rcDate)}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </HomeSection>
  );
}
