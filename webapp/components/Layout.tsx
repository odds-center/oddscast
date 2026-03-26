import React, { useState, useRef, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Icon, { type IconName } from './icons';
import { routes } from '@/lib/routes';
import { CONFIG } from '@/lib/config';

const NAV_POSITION_STORAGE_KEY = 'oddscast_nav_bar_position';
const NAV_ORIENTATION_STORAGE_KEY = 'oddscast_nav_orientation';
const SNAP_THRESHOLD = 32;
const SNAP_INSET = 8;
const DEFAULT_BOTTOM = 80;
const DEFAULT_LEFT = 16;

type NavPosition = { left: number; bottom: number };

function readStoredPosition(): NavPosition {
  if (typeof window === 'undefined') return { left: DEFAULT_LEFT, bottom: DEFAULT_BOTTOM };
  try {
    const raw = localStorage.getItem(NAV_POSITION_STORAGE_KEY);
    if (!raw) return { left: DEFAULT_LEFT, bottom: DEFAULT_BOTTOM };
    const parsed = JSON.parse(raw) as { left?: number; bottom?: number };
    if (typeof parsed?.left === 'number' && typeof parsed?.bottom === 'number')
      return { left: parsed.left, bottom: parsed.bottom };
  } catch {
    // ignore
  }
  return { left: DEFAULT_LEFT, bottom: DEFAULT_BOTTOM };
}

function readStoredOrientation(): 'horizontal' | 'vertical' {
  if (typeof window === 'undefined') return 'horizontal';
  const o = localStorage.getItem(NAV_ORIENTATION_STORAGE_KEY);
  return o === 'vertical' || o === 'horizontal' ? o : 'horizontal';
}

/** Returns env(safe-area-inset-bottom) as a pixel number */
function getSafeAreaBottomPx(): number {
  if (typeof document === 'undefined') return 0;
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;bottom:0;left:0;height:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none;';
  document.body.appendChild(el);
  const px = getComputedStyle(el).paddingBottom;
  el.remove();
  const n = parseFloat(px);
  return Number.isFinite(n) ? n : 0;
}

/** Client-only mount. Reads initial position from localStorage to avoid flicker. Fixed bottom bar on mobile, no drag. */
function FloatingAppBar({ pathname, asPath, isMobile }: { pathname: string; asPath: string; isMobile: boolean }) {
  const [navPosition, setNavPosition] = useState<NavPosition>(readStoredPosition);
  const [navOrientation, setNavOrientation] = useState<'horizontal' | 'vertical'>(
    readStoredOrientation,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [safeAreaBottom, setSafeAreaBottom] = useState(0);
  const [isAppBarHidden, setIsAppBarHidden] = useState(false);
  const safeAreaBottomRef = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ clientX: 0, clientY: 0, left: 0, bottom: 0 });
  const dragCurrent = useRef<NavPosition>({ left: DEFAULT_LEFT, bottom: DEFAULT_BOTTOM });
  const lastScrollY = useRef(0);
  const scrollTicking = useRef(false);

  useEffect(() => {
    const value = getSafeAreaBottomPx();
    safeAreaBottomRef.current = value;
    queueMicrotask(() => setSafeAreaBottom(value));
  }, []);

  // Scroll-based hide/show for mobile appbar
  useEffect(() => {
    if (!isMobile) return;
    const scrollEl = document.getElementById('main-content');
    if (!scrollEl) return;
    lastScrollY.current = scrollEl.scrollTop;

    const handleScroll = () => {
      if (scrollTicking.current) return;
      scrollTicking.current = true;
      requestAnimationFrame(() => {
        const currentY = scrollEl.scrollTop;
        const diff = currentY - lastScrollY.current;
        if (diff > 6 && currentY > 60) {
          setIsAppBarHidden(true);
        } else if (diff < -6) {
          setIsAppBarHidden(false);
        }
        lastScrollY.current = currentY;
        scrollTicking.current = false;
      });
    };

    scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  const savePosition = useCallback((pos: NavPosition) => {
    try {
      localStorage.setItem(NAV_POSITION_STORAGE_KEY, JSON.stringify(pos));
    } catch {
      // ignore
    }
  }, []);

  const toggleNavOrientation = () => {
    setNavOrientation((prev) => {
      const next = prev === 'horizontal' ? 'vertical' : 'horizontal';
      try {
        localStorage.setItem(NAV_ORIENTATION_STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  /** Snap to nearest corner/edge if close enough (bottom accounts for safe area) */
  const snapToEdges = useCallback(
    (left: number, bottom: number, barW: number, barH: number): NavPosition => {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
      const safe = safeAreaBottomRef.current;
      const minBottom = SNAP_INSET + safe;
      const maxLeft = Math.max(SNAP_INSET, vw - barW - SNAP_INSET);
      const maxBottom = Math.max(minBottom, vh - barH - SNAP_INSET);

      const corners: NavPosition[] = [
        { left: SNAP_INSET, bottom: minBottom },
        { left: maxLeft, bottom: minBottom },
        { left: SNAP_INSET, bottom: maxBottom },
        { left: maxLeft, bottom: maxBottom },
      ];
      let best = { left, bottom };
      let bestDist = SNAP_THRESHOLD + 1;
      for (const c of corners) {
        const dist = Math.hypot(left - c.left, bottom - c.bottom);
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      return best;
    },
    [],
  );

  const clampPosition = useCallback(
    (left: number, bottom: number, barW: number, barH: number): NavPosition => {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
      const minBottom = SNAP_INSET + safeAreaBottomRef.current;
      const maxLeft = Math.max(0, vw - barW - SNAP_INSET);
      const maxBottom = Math.max(0, vh - barH - SNAP_INSET);
      return {
        left: Math.max(SNAP_INSET, Math.min(maxLeft, left)),
        bottom: Math.max(minBottom, Math.min(maxBottom, bottom)),
      };
    },
    [],
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      const el = barRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - dragStart.current.clientX;
      const dy = dragStart.current.clientY - e.clientY;
      const next = clampPosition(
        dragStart.current.left + dx,
        dragStart.current.bottom + dy,
        rect.width,
        rect.height,
      );
      dragCurrent.current = next;
      setNavPosition(next);
    };
    const onUp = () => {
      const el = barRef.current;
      const current = dragCurrent.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const snapped = snapToEdges(current.left, current.bottom, rect.width, rect.height);
        setNavPosition(snapped);
        savePosition(snapped);
      } else {
        savePosition(current);
      }
      setIsDragging(false);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging, clampPosition, savePosition, snapToEdges]);

  const onDragHandlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    dragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      left: navPosition.left,
      bottom: navPosition.bottom,
    };
    dragCurrent.current = { left: navPosition.left, bottom: navPosition.bottom };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const navLinks: { href: string; icon: IconName; label: string; isActive?: (p: string, a: string) => boolean }[] = [
    { href: routes.home, icon: 'Flag', label: '홈' },
    {
      href: routes.races.list,
      icon: 'ClipboardList',
      label: '경주',
      isActive: (p) => p === '/races' || p.startsWith('/races/'),
    },
    { href: routes.predictions.matrix, icon: 'BarChart2', label: '종합' },
    { href: routes.profile.index, icon: 'User', label: '정보' },
  ];

  /* ── Mobile: fixed at screen bottom, no drag/toggle ── */
  if (isMobile) {
    return (
      <div
        className={`fixed bottom-0 left-0 right-0 z-10 px-4 transition-transform duration-300 ease-in-out ${isAppBarHidden ? 'translate-y-full' : 'translate-y-0'}`}
        style={{ paddingBottom: `max(0.5rem, env(safe-area-inset-bottom))` }}
      >
        <nav
          aria-label='메뉴'
          className='nav-mobile-bar nav-mobile-bar-fixed rounded-2xl w-full'
        >
          <div className='flex flex-row justify-between w-full px-2'>
            {navLinks.map(({ href, icon, label, isActive }) => {
              const isProfile = href === routes.profile.index;
              const active = isActive
                ? isActive(pathname, asPath)
                : isProfile
                  ? pathname === href ||
                    pathname.startsWith('/profile') ||
                    pathname.startsWith('/mypage')
                  : pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-mobile-item ${active ? 'nav-mobile-item-active' : ''}`}
                >
                  <span className='nav-mobile-icon-wrap inline-flex items-center justify-center shrink-0'>
                    <Icon name={icon} size={22} strokeWidth={active ? 2.5 : 2} />
                  </span>
                  <span className='nav-mobile-label font-medium w-full text-center text-xs truncate'>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  /* ── Desktop: floating app bar (drag/toggle) ── */
  return (
    <nav aria-label='메뉴' className='pointer-events-none fixed inset-0 z-10'>
      <div
        ref={barRef}
        className={`pointer-events-auto fixed z-10 ${navOrientation === 'vertical' ? 'w-[72px] px-1.5 pb-1.5 pt-1' : 'max-w-[400px] px-2 pb-2 pt-1.5'} ${isDragging ? 'transition-none' : 'transition-[left,bottom] duration-150 ease-out'}`}
        style={{ left: navPosition.left, bottom: navPosition.bottom + safeAreaBottom }}
      >
        <div
          className={`nav-mobile-bar pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] ${navOrientation === 'vertical' ? 'nav-mobile-bar-vertical flex flex-col w-full rounded-lg' : 'w-full max-w-[400px]'}`}
        >
          <div
            className={
              navOrientation === 'vertical'
                ? 'flex flex-col items-center gap-0 py-1 border-b border-stone-100'
                : 'flex items-center justify-between gap-0.5 border-r border-stone-100 mb-0 -mx-0.5 px-1 rounded-t-md'
            }
          >
            <button
              type='button'
              aria-label='메뉴 바 이동'
              className={`flex items-center justify-center py-1.5 px-1.5 cursor-grab active:cursor-grabbing touch-none select-none hover:bg-stone-50/80 rounded ${navOrientation === 'vertical' ? 'w-full' : 'flex-1'} ${isDragging ? 'cursor-grabbing bg-primary-muted' : ''}`}
              onPointerDown={onDragHandlePointerDown}
            >
              <Icon name='Grip' size={20} className='text-stone-500' />
            </button>
            <button
              type='button'
              onClick={toggleNavOrientation}
              aria-label={navOrientation === 'horizontal' ? '세로로 전환' : '가로로 전환'}
              className='p-1.5 rounded text-stone-500 hover:text-stone-700 hover:bg-stone-100 touch-manipulation shrink-0'
            >
              <Icon
                name={navOrientation === 'horizontal' ? 'PanelLeft' : 'PanelBottom'}
                size={20}
              />
            </button>
          </div>
          <div
            className={
              navOrientation === 'horizontal'
                ? 'flex flex-1 flex-row justify-around gap-2 px-2'
                : 'flex flex-col gap-0 py-1.5'
            }
          >
            {navLinks.map(({ href, icon, label, isActive }) => {
              const isProfile = href === routes.profile.index;
              const active = isActive
                ? isActive(pathname, asPath)
                : isProfile
                  ? pathname === href ||
                    pathname.startsWith('/profile') ||
                    pathname.startsWith('/mypage')
                  : pathname === href;
              const vertical = navOrientation === 'vertical';
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-mobile-item ${vertical ? 'nav-mobile-item-vertical' : ''} ${active ? 'nav-mobile-item-active' : ''}`}
                >
                  <span className='nav-mobile-icon-wrap inline-flex items-center justify-center shrink-0'>
                    <Icon name={icon} size={22} strokeWidth={active ? 2.5 : 2} />
                  </span>
                  <span
                    className={`nav-mobile-label font-medium w-full text-center ${vertical ? 'text-xs leading-tight' : 'text-xs truncate'}`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
}

const DEFAULT_DESCRIPTION = 'AI 기반 경마 승부 예측 서비스 - 공공데이터 분석과 인공지능으로 경마를 더 스마트하게. 서울, 부산, 제주 경마장 경주 분석, 출전마 데이터, AI 예측 제공.';
const DEFAULT_KEYWORDS = '경마 예측, AI 경마, 경마 분석, 경마 승부 예측, 말 경주, 경마장, 서울경마, 부산경마, 제주경마, OddsCast, 오즈캐스트, 경마 데이터, 경마 AI, 경주 분석, 출전마 분석, 기수 분석, 경마 순위, 경마 결과, KRA, 한국경마';

const WEBAPP_URL = CONFIG.webapp.baseURL;

const JSON_LD_WEBSITE = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'OddsCast',
  alternateName: '오즈캐스트',
  url: WEBAPP_URL,
  description: DEFAULT_DESCRIPTION,
  inLanguage: 'ko',
  publisher: {
    '@type': 'Organization',
    name: 'OddsCast',
    logo: {
      '@type': 'ImageObject',
      url: `${WEBAPP_URL}/oddscast-logo.png`,
    },
  },
});

const Layout: React.FC<LayoutProps> = ({ children, title = 'OddsCast', description = DEFAULT_DESCRIPTION, keywords = DEFAULT_KEYWORDS }) => {
  const router = useRouter();
  const canonicalUrl = `${WEBAPP_URL}${router.asPath.split('?')[0]}`;
  const ogImage = `${WEBAPP_URL}/og-image.png`;

  return (
    <div id='main-content' className='h-dvh bg-background flex flex-col overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain w-full max-w-full'>
      <a
        href='#main-content'
        className='absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 [clip:rect(0,0,0,0)] focus:absolute focus:z-[100] focus:left-4 focus:top-4 focus:w-auto focus:h-auto focus:p-4 focus:m-0 focus:overflow-visible focus:whitespace-normal focus:[clip:auto] focus:bg-primary focus:text-white focus:rounded-lg focus:font-medium focus:outline-none'
      >
        Skip to main content
      </a>
      <Head>
        <title>{title}</title>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover'
        />
        <meta name='description' content={description} />
        <meta name='keywords' content={keywords} />
        <meta name='author' content='OddsCast' />
        <meta name='robots' content='index, follow' />
        <meta name='theme-color' content='#1c1917' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <link rel='canonical' href={canonicalUrl} />
        <meta property='og:title' content={title} />
        <meta property='og:description' content={description} />
        <meta property='og:image' content={ogImage} />
        <meta property='og:image:width' content='1129' />
        <meta property='og:image:height' content='630' />
        <meta property='og:image:type' content='image/png' />
        <meta property='og:image:alt' content='OddsCast - AI 기반 경마 승부 예측' />
        <meta property='og:url' content={canonicalUrl} />
        <meta property='og:type' content='website' />
        <meta property='og:locale' content='ko_KR' />
        <meta property='og:site_name' content='OddsCast' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={title} />
        <meta name='twitter:description' content={description} />
        <meta name='twitter:image' content={ogImage} />
        <meta name='twitter:image:alt' content='OddsCast - AI 기반 경마 승부 예측' />
        <meta name='naver-site-verification' content='' />
        <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON_LD_WEBSITE }} />
      </Head>

      <main role='main' aria-label='Main content' className='flex-1 w-full min-w-0 flex flex-col lg:max-w-[1200px] mx-auto pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-0 lg:pl-[max(2rem,env(safe-area-inset-left))] lg:pr-[max(2rem,env(safe-area-inset-right))] lg:pt-6'>
        <div className='px-0 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-[max(1.25rem,env(safe-area-inset-top))] lg:pt-8 pb-[200px] sm:pb-[220px] lg:pb-[400px]'>
          {children}
        </div>
      </main>
    </div>
  );
};

export { FloatingAppBar };
export default Layout;
