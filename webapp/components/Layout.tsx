import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Icon, { type IconName } from "./icons";
import { routes } from "@/lib/routes";
import { CONFIG } from "@/lib/config";
import { useNativeApp } from "@/lib/hooks/useNativeApp";
import { useUnreadNotifications } from "@/lib/hooks/useUnreadNotifications";
import { useTicketBalance } from "@/lib/hooks/useTicketBalance";

/** Client-only mount. Fixed bottom bar on all screen sizes. */
function FloatingAppBar({
  pathname,
  asPath,
}: {
  pathname: string;
  asPath: string;
}) {
  const { haptic } = useNativeApp();
  const unreadCount = useUnreadNotifications();
  const { raceTickets, matrixTickets } = useTicketBalance();
  const [isAppBarHidden, setIsAppBarHidden] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTicking = useRef(false);

  // Scroll-based hide/show for appbar
  useEffect(() => {
    const scrollEl = document.getElementById("main-content");
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

    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks: {
    href: string;
    icon: IconName;
    label: string;
    badge?: number;
    isActive?: (p: string, a: string) => boolean;
  }[] = [
    { href: routes.home, icon: "Flag", label: "홈" },
    {
      href: routes.races.list,
      icon: "ClipboardList",
      label: "경주",
      badge: raceTickets,
      isActive: (p) => p === "/races" || p.startsWith("/races/"),
    },
    { href: routes.predictions.matrix, icon: "BarChart2", label: "종합", badge: matrixTickets },
    { href: routes.results, icon: "TrendingUp", label: "결과" },
    { href: routes.profile.index, icon: "User", label: "정보" },
  ];

  /* ── Fixed bottom bar on all screen sizes ── */
  return (
    <div
      data-tour="home-appbar"
      className={`fixed bottom-0 left-0 right-0 z-10 px-3 transition-transform duration-300 ease-in-out ${isAppBarHidden ? "translate-y-full" : "translate-y-0"}`}
      style={{ paddingBottom: `calc(max(0.75rem, env(safe-area-inset-bottom)) + 0.25rem)` }}
    >
      <nav
        aria-label="메뉴"
        className="nav-mobile-bar nav-mobile-bar-fixed rounded-2xl w-full max-w-[600px] mx-auto"
      >
        <div className="flex flex-row justify-between w-full px-2">
          {navLinks.map(({ href, icon, label, badge, isActive }) => {
            const isProfile = href === routes.profile.index;
            const active = isActive
              ? isActive(pathname, asPath)
              : isProfile
                ? pathname === href ||
                  pathname.startsWith("/profile") ||
                  pathname.startsWith("/mypage")
                : pathname === href;
            const hasTickets = !isProfile && (badge ?? 0) > 0;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => haptic('light')}
                className={`nav-mobile-item ${active ? "nav-mobile-item-active" : ""}`}
              >
                <span className="nav-mobile-icon-wrap inline-flex items-center justify-center shrink-0">
                  {isProfile && unreadCount > 0 ? (
                    <span className="relative inline-flex">
                      <Icon
                        name={icon}
                        size={22}
                        strokeWidth={active ? 2.5 : 2}
                      />
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    </span>
                  ) : (
                    <Icon
                      name={icon}
                      size={22}
                      strokeWidth={active ? 2.5 : 2}
                    />
                  )}
                </span>
                <span className="nav-mobile-label font-medium w-full text-center text-xs truncate">
                  {label}
                </span>
                {hasTickets && (
                  <span className="text-[9px] font-semibold text-emerald-600 leading-none -mt-0.5">
                    {badge}장
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
}

const DEFAULT_DESCRIPTION =
  "오즈캐스트(OddsCast) - AI 기반 경마 승부 예측 서비스. 공공데이터 분석과 인공지능으로 경마를 더 스마트하게. 서울, 부산, 제주 경마장 경주 분석, 출전마 데이터, AI 예측 제공.";
const DEFAULT_KEYWORDS =
  "경마 예측, AI 경마, 경마 분석, 경마 승부 예측, 말 경주, 경마장, 서울경마, 부산경마, 제주경마, OddsCast, 오즈캐스트, 경마 데이터, 경마 AI, 경주 분석, 출전마 분석, 기수 분석, 경마 순위, 경마 결과, KRA, 한국경마";

const WEBAPP_URL = CONFIG.webapp.baseURL;

const JSON_LD_WEBSITE = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "OddsCast",
  alternateName: "오즈캐스트",
  url: WEBAPP_URL,
  description: DEFAULT_DESCRIPTION,
  inLanguage: "ko",
  publisher: {
    "@type": "Organization",
    name: "OddsCast",
    logo: {
      "@type": "ImageObject",
      url: `${WEBAPP_URL}/logo.png`,
    },
  },
});

const Layout: React.FC<LayoutProps> = ({
  children,
  title = "OddsCast",
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
}) => {
  const router = useRouter();
  const canonicalUrl = `${WEBAPP_URL}${router.asPath.split("?")[0]}`;
  const ogImage = `${WEBAPP_URL}/og-image.png`;

  return (
    <div
      id="main-content"
      className="h-dvh bg-background flex flex-col overflow-y-auto overflow-x-hidden overscroll-behavior-y-contain w-full max-w-full"
    >
      <a
        href="#main-content"
        className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 [clip:rect(0,0,0,0)] focus:absolute focus:z-[100] focus:left-4 focus:top-4 focus:w-auto focus:h-auto focus:p-4 focus:m-0 focus:overflow-visible focus:whitespace-normal focus:[clip:auto] focus:bg-primary focus:text-white focus:rounded-lg focus:font-medium focus:outline-none"
      >
        Skip to main content
      </a>
      <Head>
        <title>{title}</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover"
        />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content="OddsCast" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#1c1917" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1129" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta
          property="og:image:alt"
          content="OddsCast - AI 기반 경마 승부 예측"
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:site_name" content="오즈캐스트 OddsCast" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        <meta
          name="twitter:image:alt"
          content="OddsCast - AI 기반 경마 승부 예측"
        />
        <meta name="naver-site-verification" content="" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON_LD_WEBSITE }}
        />
      </Head>

      <main
        role="main"
        aria-label="Main content"
        className="flex-1 w-full min-w-0 flex flex-col lg:max-w-[1200px] mx-auto pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-0 lg:pl-[max(2rem,env(safe-area-inset-left))] lg:pr-[max(2rem,env(safe-area-inset-right))] lg:pt-6"
      >
        <div className="px-0 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-[max(1.25rem,env(safe-area-inset-top))] lg:pt-8 pb-[200px] sm:pb-[220px] lg:pb-[400px]">
          {children}
        </div>
      </main>
    </div>
  );
};

export { FloatingAppBar };
export default Layout;
