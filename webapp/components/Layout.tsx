import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Icon, { type IconName } from './icons';
import { useAuthStore } from '@/lib/store/authStore';
import { useIsNativeApp } from '@/lib/hooks/useIsNativeApp';
import { routes } from '@/lib/routes';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'GOLDEN RACE' }) => {
  const router = useRouter();
  const pathname = router.pathname;
  const isNativeApp = useIsNativeApp();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  /** Native WebView: 상단 헤더는 mobile 앱에서 제공 → 중복 방지 */
  const hideTopHeader = isNativeApp;
  const logout = useAuthStore((s) => s.logout);
  const showBackButton = pathname !== '/' && pathname !== '';

  const handleLogout = () => {
    logout();
    router.push(routes.home);
  };

  const handleBack = () => {
    router.back();
  };

  const navLinks: { href: string; icon: IconName; label: string }[] = [
    { href: routes.home, icon: 'Flag', label: '홈' },
    { href: routes.races.list, icon: 'ClipboardList', label: '경주' },
    { href: routes.predictions.matrix, icon: 'BarChart2', label: '종합 예상' },
    { href: routes.results, icon: 'TrendingUp', label: '결과' },
    { href: routes.ranking, icon: 'Medal', label: '랭킹' },
  ];

  const navLinksMore: { href: string; icon: IconName; label: string }[] = [
    { href: routes.mypage.notifications, icon: 'Bell', label: '알림' },
    { href: routes.mypage.subscriptions, icon: 'Crown', label: '구독' },
    { href: routes.profile.index, icon: 'User', label: '내 정보' },
    { href: routes.settings, icon: 'Settings', label: '설정' },
  ];

  return (
    <div className='h-dvh bg-background flex flex-col overflow-hidden w-full max-w-full'>
      <Head>
        <title>{title}</title>
        <meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover' />
        <meta name='theme-color' content='#fafafa' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
      </Head>

      {/* Desktop: 상단 네비게이션 — 다크 그라데이션 프리미엄 스타일 */}
      <header className='hidden lg:block sticky top-0 z-20 site-header-inner'>
        <div className='max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between'>
          <Link href={routes.home} className='logo-link font-display'>
            GOLDEN RACE
          </Link>
          <nav className='flex items-center gap-2'>
            {navLinks.map(({ href, icon, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-pill flex items-center gap-1.5 ${active ? 'nav-pill-active' : ''}`}
                >
                  <Icon name={icon} size={16} className={active ? 'opacity-90' : ''} />
                  {label}
                </Link>
              );
            })}
            {navLinksMore.map(({ href, icon, label }) => {
              const active = pathname === href || (href === routes.profile.index && (pathname.startsWith('/profile') || pathname.startsWith('/mypage')));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-pill flex items-center gap-1.5 ${active ? 'nav-pill-active' : ''}`}
                >
                  <Icon name={icon} size={16} className={active ? 'opacity-90' : ''} />
                  {label}
                </Link>
              );
            })}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className='nav-pill ml-2 bg-white/10 hover:bg-white/20 text-white border border-white/20'
              >
                로그아웃
              </button>
            ) : (
              <Link
                href={routes.auth.login}
                className='nav-pill-active ml-2 flex items-center gap-1.5 px-4 py-2'
              >
                <Icon name='LogIn' size={16} />
                로그인
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile/Tablet: 상단 헤더 (Native WebView에서는 mobile 앱이 제공하므로 숨김) */}
      {!hideTopHeader && (
      <header className='lg:hidden sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-border pt-[env(safe-area-inset-top)] shadow-sm'>
        <div className='h-14 flex items-center px-4'>
          <div className='flex-1 flex items-center min-w-0'>
            {showBackButton ? (
              <button
                type='button'
                onClick={handleBack}
                className='flex items-center justify-center w-10 h-10 -ml-2 shrink-0 text-foreground touch-manipulation rounded-xl hover:bg-primary/10 active:opacity-80'
                aria-label='뒤로'
              >
                <Icon name='ChevronLeft' size={24} />
              </button>
            ) : (
              <div className='w-10 shrink-0' />
            )}
            <Link
              href={routes.home}
              className='flex-1 flex justify-center min-w-0 font-display font-bold text-base tracking-[0.12em] text-primary touch-manipulation'
            >
              <span className='truncate'>GOLDEN RACE</span>
            </Link>
            <div className='w-10 shrink-0' />
          </div>
        </div>
        <div className='h-0.5 bg-linear-to-r from-transparent via-primary/40 to-transparent' />
      </header>
      )}

      {/* Content — 모바일: safe-area, 하단 nav 여백. Native WebView: 헤더 숨김 시 상단 safe-area */}
      <main
        className={`flex-1 w-full min-w-0 min-h-0 overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain lg:max-w-[1200px] mx-auto px-4 lg:px-8 py-4 lg:py-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(6rem,calc(4.5rem+env(safe-area-inset-bottom)))] lg:pb-10 ${
          hideTopHeader ? 'pt-[max(1rem,env(safe-area-inset-top))]' : ''
        }`}
      >
        {children}
      </main>

      {/* Mobile/Tablet: 하단 네비게이션 — 플로팅 카드 스타일 */}
      <nav
        className='lg:hidden fixed bottom-0 left-0 right-0 z-10 safe-area-bottom px-4 pb-3 pt-2'
        aria-label='하단 메뉴'
      >
        <div className='nav-mobile-bar max-w-[400px] mx-auto pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]'>
          {navLinks.map(({ href, icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`nav-mobile-item ${active ? 'nav-mobile-item-active' : ''}`}
              >
                <span className='nav-mobile-icon-wrap inline-flex items-center justify-center shrink-0'>
                  <Icon name={icon} size={20} strokeWidth={active ? 2.5 : 2} />
                </span>
                <span className='nav-mobile-label text-xs font-medium truncate w-full text-center'>{label}</span>
              </Link>
            );
          })}
          <Link
            href={routes.profile.index}
            className={`nav-mobile-item ${pathname === routes.profile.index || pathname.startsWith('/profile') || pathname.startsWith('/mypage') ? 'nav-mobile-item-active' : ''}`}
          >
            <span className='nav-mobile-icon-wrap inline-flex items-center justify-center shrink-0'>
              <Icon name='User' size={20} strokeWidth={pathname === routes.profile.index || pathname.startsWith('/profile') || pathname.startsWith('/mypage') ? 2.5 : 2} />
            </span>
            <span className='nav-mobile-label text-xs font-medium truncate w-full text-center'>내 정보</span>
          </Link>
        </div>
      </nav>

      {/* Desktop: 푸터 — 그라데이션 라인, 풍부한 스타일 */}
      <footer className='hidden lg:block site-footer py-8 mt-4'>
        <div className='max-w-[1200px] mx-auto px-8'>
          <div className='flex flex-wrap items-center justify-center gap-6 text-text-tertiary text-sm'>
            <span className='font-medium text-foreground/80'>© GOLDEN RACE — AI 경마 승부예측 서비스</span>
            <Link href={routes.legal.terms} className='hover:text-primary transition-colors font-medium'>
              이용약관
            </Link>
            <Link href={routes.legal.privacy} className='hover:text-primary transition-colors font-medium'>
              개인정보처리방침
            </Link>
          </div>
          <p className='text-center text-text-tertiary text-xs mt-4 max-w-xl mx-auto'>
            본 서비스는 사행성을 조장하지 않으며, AI 분석 콘텐츠 제공 목적입니다.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
