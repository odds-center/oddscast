/**
 * Race list sorting: rcNo must be ordered numerically (1, 2, 3, ..., 10, 11)
 * not lexicographically (1, 10, 11, 2, 3).
 */

/** Parse race number for numeric sort (e.g. "1" -> 1, "10" -> 10) */
export function parseRcNo(rcNo: string | null | undefined): number {
  if (rcNo == null || rcNo === '') return 0;
  const n = parseInt(String(rcNo).trim(), 10);
  return Number.isNaN(n) ? 0 : n;
}

export interface SortRacesOptions<T> {
  getRcDate: (item: T) => string;
  getMeet?: (item: T) => string;
  getRcNo: (item: T) => string;
  /** rcDate order: desc = newest first (list), asc = oldest first (schedule/batch) */
  rcDateOrder?: 'asc' | 'desc';
}

/**
 * Sort race list by rcDate then by numeric rcNo (and optionally meet).
 * Use after findMany when DB orderBy is string-based (rcNo 'asc' gives 1,10,11,2).
 */
export function sortRacesByNumericRcNo<T>(
  items: T[],
  options: SortRacesOptions<T>,
): T[] {
  const {
    getRcDate,
    getMeet = () => '',
    getRcNo,
    rcDateOrder = 'desc',
  } = options;
  const dateMult = rcDateOrder === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    const dateA = getRcDate(a);
    const dateB = getRcDate(b);
    const dateCmp = (dateA || '').localeCompare(dateB || '');
    if (dateCmp !== 0) return dateCmp * dateMult;

    const meetA = getMeet(a);
    const meetB = getMeet(b);
    const meetCmp = (meetA || '').localeCompare(meetB || '');
    if (meetCmp !== 0) return meetCmp;

    const noA = parseRcNo(getRcNo(a));
    const noB = parseRcNo(getRcNo(b));
    return noA - noB;
  });
}
