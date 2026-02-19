import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Icon, { type IconName } from './icons';
import { routes } from '@/lib/routes';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'GOLDEN RACE' }) => {
  const router = useRouter();
  const pathname = router.pathname;

  /** 하단 네비 — 5개 고정: 홈 / 경주 / 종합 / 결과 / 내 정보. 랭킹·알림·구독·설정은 내 정보(프로필) 메뉴에서 진입 */
  const navLinks: { href: string; icon: IconName; label: string }[] = [
    { href: routes.home, icon: 'Flag', label: '홈' },
    { href: routes.races.list, icon: 'ClipboardList', label: '경주' },
    { href: routes.predictions.matrix, icon: 'BarChart2', label: '종합' },
    { href: routes.results, icon: 'TrendingUp', label: '결과' },
    { href: routes.profile.index, icon: 'User', label: '내 정보' },
  ];

  return (
    <div className='h-dvh bg-background flex flex-col overflow-hidden w-full max-w-full'>
      <Head>
        <title>{title}</title>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover'
        />
        <meta name='theme-color' content='#fafafa' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
      </Head>

      {/* 상단 헤더 제거 — 네비는 하단 탭바만 사용 */}

      {/* Content — 모바일: 상단 패딩 없음(헤더가 상단에 붙음), 데스크: 1.5rem. 가로는 16px/32px */}
      <main className='flex-1 w-full min-w-0 min-h-0 overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain flex flex-col lg:max-w-[1200px] mx-auto pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-0 lg:pl-[max(2rem,env(safe-area-inset-left))] lg:pr-[max(2rem,env(safe-area-inset-right))] lg:pt-6'>
        <div className='px-0 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-[max(1.25rem,env(safe-area-inset-top))] lg:pt-8 pb-[200px] sm:pb-[220px] lg:pb-[400px]'>
          {children}
        </div>
      </main>

      {/* 푸터 — fixed, 하단 네비 바로 아래 고정. 항상 보임 */}
      <footer className='site-footer-fixed'>
        <div className='flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-4 text-text-tertiary text-[12px] sm:text-xs px-2 sm:px-4'>
          <span className='font-medium text-foreground/80'>© GOLDEN RACE</span>
          <Link href={routes.legal.terms} className='hover:text-primary transition-colors'>
            이용약관
          </Link>
          <Link href={routes.legal.privacy} className='hover:text-primary transition-colors'>
            개인정보처리방침
          </Link>
          <span className='text-text-tertiary/80'>사행성 없음</span>
        </div>
      </footer>

      {/* 하단 네비게이션 — 푸터 위 플로팅. 모바일: 패딩 줄이고 넓게, 데스크: 중앙 max-w */}
      <nav
        className='fixed left-0 right-0 z-10 px-2 sm:px-4 pb-2 sm:pb-3 pt-1.5 sm:pt-2 bottom-[calc(2.5rem+2.5rem+env(safe-area-inset-bottom))] lg:bottom-20'
        aria-label='하단 메뉴'
      >
        <div className='nav-mobile-bar w-full max-w-[420px] mx-auto pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]'>
          {navLinks.map(({ href, icon, label }) => {
            const isProfile = href === routes.profile.index;
            const active = isProfile
              ? pathname === href || pathname.startsWith('/profile') || pathname.startsWith('/mypage')
              : pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`nav-mobile-item ${active ? 'nav-mobile-item-active' : ''}`}
              >
                <span className='nav-mobile-icon-wrap inline-flex items-center justify-center shrink-0'>
                  <Icon name={icon} size={20} strokeWidth={active ? 2.5 : 2} />
                </span>
                <span className='nav-mobile-label text-xs font-medium truncate w-full text-center'>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
