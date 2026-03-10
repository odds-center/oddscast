/**
 * 오늘의 경마운세 카드 — 로그인 시 4항목 노출, 비로그인 시 티저 카드로 빈 칸 채움
 * 참고용·오락 목적, 베팅 권유 아님.
 */
import Icon from '@/components/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import FortuneApi from '@/lib/api/fortuneApi';
import type { TodaysFortune } from '@/lib/api/fortuneApi';
import { useAuthStore } from '@/lib/store/authStore';
import { routes } from '@/lib/routes';

export default function TodaysFortuneCard() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { data: fortune, error } = useQuery({
    queryKey: ['fortune', 'today'],
    queryFn: () => FortuneApi.getToday(),
    enabled: isLoggedIn,
    placeholderData: keepPreviousData,
  });

  // Teaser card when not logged in — fills grid slot and encourages login
  if (!isLoggedIn) {
    return (
      <section
        className='rounded-xl border border-border bg-card overflow-hidden shadow-sm'
        aria-label='오늘의 경마운세'
      >
        <div className='bg-stone-50 border-b border-border px-4 py-3 flex items-center gap-2'>
          <Icon name='Star' size={18} className='text-primary' />
          <h2 className='text-sm font-bold text-foreground'>오늘의 경마운세</h2>
        </div>
        <div className='p-6 flex flex-col items-center justify-center text-center min-h-[140px]'>
          <p className='text-sm text-text-secondary mb-3'>
            로그인하면 오늘의 운세를 확인할 수 있어요.
          </p>
          <Button asChild>
            <Link href={routes.auth.login}>
              <Icon name='LogIn' size={16} />
              로그인
            </Link>
          </Button>
        </div>
      </section>
    );
  }
  if (error) {
    return (
      <section className='rounded-xl border border-border bg-card overflow-hidden shadow-sm' aria-label='오늘의 경마운세'>
        <div className='bg-stone-50 border-b border-border px-4 py-3 flex items-center gap-2'>
          <Icon name='Star' size={18} className='text-primary' />
          <h2 className='text-sm font-bold text-foreground'>오늘의 경마운세</h2>
        </div>
        <div className='p-6'>
          <p className='text-sm text-text-secondary'>오늘의 운세를 불러오지 못했습니다.</p>
        </div>
      </section>
    );
  }

  // Logged in but data not ready yet — show placeholder so grid slot is never empty
  if (!fortune) {
    return (
      <section className='rounded-xl border border-border bg-card overflow-hidden shadow-sm' aria-label='오늘의 경마운세'>
        <div className='bg-stone-50 border-b border-border px-4 py-3 flex items-center gap-2'>
          <Icon name='Star' size={18} className='text-primary' />
          <h2 className='text-sm font-bold text-foreground'>오늘의 경마운세</h2>
        </div>
        <div className='p-6 flex flex-col items-center justify-center text-center min-h-[140px]'>
          <p className='text-sm text-text-secondary'>오늘의 운세를 준비하고 있어요.</p>
        </div>
      </section>
    );
  }

  const f = fortune as TodaysFortune;
  return (
    <section
      className='rounded-xl border border-border bg-card overflow-hidden shadow-sm'
      aria-label='오늘의 경마운세'
    >
      <div className='bg-stone-50 border-b border-border px-4 py-3 flex items-center gap-2'>
        <Icon name='Star' size={18} className='text-primary' />
        <h2 className='text-sm font-bold text-foreground'>오늘의 경마운세</h2>
      </div>
      <div className='p-4 space-y-4'>
        <div>
          <p className='text-xs text-text-tertiary font-semibold mb-1'>종합</p>
          <p className='text-sm text-foreground leading-relaxed'>{f.messageOverall}</p>
        </div>
        <div>
          <p className='text-xs text-text-tertiary font-semibold mb-1'>경주 운세</p>
          <p className='text-sm text-foreground leading-relaxed'>{f.messageRace}</p>
        </div>
        <div>
          <p className='text-xs text-text-tertiary font-semibold mb-1'>오늘의 조언</p>
          <p className='text-sm text-foreground leading-relaxed'>{f.messageAdvice}</p>
        </div>
        <div>
          <p className='text-xs text-text-tertiary font-semibold mb-2'>행운의 요소</p>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-xs text-text-secondary'>번호</span>
            {f.luckyNumbers.map((n, i) => (
              <span
                key={i}
                className='inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-sm'
              >
                {n}
              </span>
            ))}
            <span className='text-text-tertiary text-xs mx-1'>·</span>
            <span className='text-xs text-text-secondary'>색</span>
            <span className='inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium border border-border bg-stone-50'>
              {f.luckyColorHex && (
                <span
                  className='w-4 h-4 rounded-full shrink-0 border border-border'
                  style={{ backgroundColor: f.luckyColorHex }}
                  aria-hidden
                />
              )}
              {f.luckyColor}
            </span>
            {f.keyword && (
              <>
                <span className='text-text-tertiary text-xs mx-1'>·</span>
                <span className='text-xs text-text-secondary'>키워드</span>
                <span className='px-2 py-1 rounded-md bg-amber-50 text-amber-800 text-sm font-medium'>
                  {f.keyword}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <p className='px-4 py-2 bg-stone-50 border-t border-border text-xs text-text-tertiary'>
        참고용·오락 목적이며, 베팅 권유가 아닙니다.
      </p>
    </section>
  );
}
