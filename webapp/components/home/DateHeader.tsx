/**
 * 날짜 헤더 — KRA 스타일 (예: 2026년 02월 13일 금요일)
 */
export default function DateHeader() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekDay = weekDays[now.getDay()];

  return (
    <div className='date-header-kra'>
      <h2 className='text-lg sm:text-xl font-semibold text-foreground'>
        {year}년 {month.toString().padStart(2, '0')}월 {day.toString().padStart(2, '0')}일 {weekDay}요일
      </h2>
    </div>
  );
}
