/**
 * 표시용 포맷 유틸
 */

/** YYYYMMDD 또는 YYYY-MM-DD → "2025.02.15" */
export function formatRcDate(rcDate: string | undefined): string {
  if (!rcDate) return '-';
  const norm = rcDate.replace(/-/g, '');
  if (norm.length < 8) return rcDate;
  return `${norm.slice(0, 4)}.${norm.slice(4, 6)}.${norm.slice(6, 8)}`;
}

/** YYYYMMDD → "2월 15일" (간단 표시) */
export function formatRcDateShort(rcDate: string | undefined): string {
  if (!rcDate || rcDate.length < 8) return rcDate ?? '-';
  const m = parseInt(rcDate.slice(4, 6), 10);
  const d = parseInt(rcDate.slice(6, 8), 10);
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  return `${monthNames[m - 1] ?? m}월 ${d}일`;
}
