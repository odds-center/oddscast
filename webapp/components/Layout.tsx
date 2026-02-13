import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Icon from './icons';
import { useAuthStore } from '@/lib/store/authStore';
import { routes } from '@/lib/routes';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title = 'GOLDEN RACE' }) => {
  const router = useRouter();
  const pathname = router.pathname;
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const logout = useAuthStore((s) => s.logout);
  const showBackButton = pathname !== '/' && pathname !== '';

  const handleLogout = () => {
    logout();
    router.push(routes.home);
  };

  const handleBack = () => {
    router.back();
  };

  const navLinks = [
    { href: routes.home, icon: 'Flag', label: '경주' },
    { href: routes.results, icon: 'TrendingUp', label: '결과' },
    { href: routes.ranking, icon: 'Medal', label: '랭킹' },
  ];

  const navLinksMore = [
    { href: routes.mypage.picks, icon: 'Bookmark', label: '내가 고른 말' },
    { href: routes.mypage.favorites, icon: 'Heart', label: '즐겨찾기' },
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
        <meta name='theme-color' content='#050508' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='black-translucent' />
      </Head>

      {/* Desktop: 상단 네비게이션 (lg 1024px 이상에서만 표시) */}
      <header className='hidden lg:block sticky top-0 z-20'>
        <div className='bg-background-elevated/95 backdrop-blur-md border-b border-border'>
          <div className='max-w-7xl mx-auto px-6 h-16 flex items-center justify-between'>
            <Link
              href={routes.home}
              className='font-display font-bold text-xl tracking-[0.2em] text-primary hover:text-primary/90 transition-all duration-200'
            >
              GOLDEN RACE
            </Link>
            <nav className='flex items-center gap-1'>
              {navLinks.map(({ href, icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`nav-item-desktop flex items-center gap-1.5 px-3 py-2 rounded-xl ${
                    pathname === href ? 'text-primary bg-primary/10' : ''
                  }`}
                >
                  <Icon name={icon as any} size={17} />
                  {label}
                </Link>
              ))}
              {navLinksMore.map(({ href, icon, label }) => {
                const isActive = pathname === href || (href === routes.profile.index && (pathname.startsWith('/profile') || pathname.startsWith('/mypage')));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`nav-item-desktop flex items-center gap-1.5 px-3 py-2 rounded-xl ${
                      isActive ? 'text-primary bg-primary/10' : ''
                    }`}
                  >
                    <Icon name={icon as any} size={17} />
                    {label}
                  </Link>
                );
              })}
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className='btn-secondary ml-2 flex items-center gap-1.5 px-3 py-1.5 text-sm'
                >
                  로그아웃
                </button>
              ) : (
                <Link
                  href={routes.auth.login}
                  className='btn-primary ml-2 flex items-center gap-1.5 px-4 py-2 text-sm'
                >
                  <Icon name='LogIn' size={17} />
                  로그인
                </Link>
              )}
            </nav>
          </div>
          {/* 하단 금색 그라데이션 라인 */}
          <div className='h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent' />
        </div>
      </header>

      {/* Mobile/Tablet: 상단 헤더 (1024px 미만) */}
      <header className='lg:hidden sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border pt-[env(safe-area-inset-top)]'>
        <div className='h-14 flex items-center px-4'>
          <div className='flex-1 flex items-center min-w-0'>
            {showBackButton ? (
              <button
                type='button'
                onClick={handleBack}
                className='flex items-center justify-center w-10 h-10 -ml-2 shrink-0 text-foreground touch-manipulation rounded-lg hover:bg-primary/10 active:opacity-80'
                aria-label='뒤로'
              >
                <Icon name='ChevronLeft' size={24} />
              </button>
            ) : (
              <div className='w-10 shrink-0' />
            )}
            <Link
              href={routes.home}
              className='flex-1 flex justify-center min-w-0 font-display font-bold text-lg tracking-[0.15em] text-primary touch-manipulation'
            >
              <span className='truncate'>GOLDEN RACE</span>
            </Link>
            <div className='w-10 shrink-0' />
          </div>
        </div>
        <div className='h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent' />
      </header>

      {/* Content — 모바일: safe-area, 하단 nav 여백, 가로 스크롤 방지, flex 스크롤 */}
      <main className='flex-1 w-full min-w-0 min-h-0 overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain lg:max-w-5xl mx-auto px-4 lg:px-8 py-4 lg:py-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(6rem,calc(4.5rem+env(safe-area-inset-bottom)))] lg:pb-10'>
        {children}
      </main>

      {/* Mobile/Tablet: 하단 네비게이션 (1024px 미만) */}
      <nav
        className='lg:hidden fixed bottom-0 left-0 right-0 z-10 bg-background-elevated/98 backdrop-blur-md border-t border-border safe-area-bottom'
        aria-label='하단 메뉴'
      >
        <div className='w-full mx-auto h-14 min-h-[56px] flex items-stretch justify-around pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)]'>
          {navLinks.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item-mobile flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 touch-manipulation ${pathname === href ? 'text-primary' : ''}`}
            >
              <Icon name={icon as any} size={22} className={`shrink-0 ${pathname === href ? 'text-primary' : ''}`} />
              <span className='text-xs truncate block text-center w-full px-0.5'>{label}</span>
            </Link>
          ))}
          <Link
            href={routes.profile.index}
            className={`nav-item-mobile flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 touch-manipulation ${pathname === routes.profile.index || pathname.startsWith('/profile') || pathname.startsWith('/mypage') ? 'text-primary' : ''}`}
          >
            <Icon name='User' size={22} className={`shrink-0 ${pathname === routes.profile.index || pathname.startsWith('/profile') || pathname.startsWith('/mypage') ? 'text-primary' : ''}`} />
            <span className='text-xs truncate block text-center w-full px-0.5'>내 정보</span>
          </Link>
        </div>
      </nav>

      {/* Desktop: 푸터 */}
      <footer className='hidden lg:block border-t border-border py-6'>
        <div className='max-w-5xl mx-auto px-8'>
          <div className='flex flex-wrap items-center justify-center gap-4 text-text-tertiary text-sm'>
            <span>© GOLDEN RACE — AI 경마 승부예측 서비스</span>
            <Link href={routes.legal.terms} className='hover:text-primary transition-colors'>
              이용약관
            </Link>
            <Link href={routes.legal.privacy} className='hover:text-primary transition-colors'>
              개인정보처리방침
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
