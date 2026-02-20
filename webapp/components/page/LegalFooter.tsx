import Link from 'next/link';
import { routes } from '@/lib/routes';

/** 이용약관·개인정보처리방침·환불정책 등 푸터 (정보 페이지 등에서 사용) */
export default function LegalFooter() {
  return (
    <footer className='mt-8 pt-6 border-t border-stone-200'>
      <div className='flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-text-tertiary text-[12px] sm:text-xs px-2'>
        <span className='font-medium text-foreground/80'>© GOLDEN RACE</span>
        <Link
          href={routes.legal.terms}
          className='hover:text-stone-700 hover:underline transition-colors'
        >
          이용약관
        </Link>
        <Link
          href={routes.legal.privacy}
          className='hover:text-stone-700 hover:underline transition-colors'
        >
          개인정보처리방침
        </Link>
        <Link
          href={routes.legal.refund}
          className='hover:text-stone-700 hover:underline transition-colors'
        >
          환불정책
        </Link>
        <span className='text-text-tertiary/80'>사행성 없음</span>
      </div>
    </footer>
  );
}
