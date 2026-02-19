/**
 * 표시용 포맷 유틸
 */

/** rcDate(YYYYMMDD)가 오늘 이전이면 true — 날짜 지난 경주는 종료로 간주 */
export function isPastRaceDate(rcDate: string | null | undefined): boolean {
  if (!rcDate || typeof rcDate !== 'string') return false;
  const norm = rcDate.replace(/-/g, '').slice(0, 8);
  if (norm.length < 8) return false;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}${m}${d}`;
  return norm < todayStr;
}

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
