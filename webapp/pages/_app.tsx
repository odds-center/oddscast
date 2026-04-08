import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import { useRouter } from 'next/router';
import * as Sentry from '@sentry/nextjs';
import { QueryClient, QueryClientProvider, HydrationBoundary, onlineManager } from '@tanstack/react-query';
import type { DehydratedState } from '@tanstack/react-query';
import 'pretendard/dist/web/static/pretendard.css';
import '@/styles/globals.css';
import bridge from '@/lib/bridge';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { useAccessibilityStore } from '@/lib/store/accessibilityStore';
import { useCoachMarkStore } from '@/lib/coachMark/coachMarkStore';
import AuthApi from '@/lib/api/authApi';

/** Hydrates coach mark completed state from server — must run inside QueryClientProvider. */
function CoachMarkHydration() {
  const token = useAuthStore((s) => s.token);
  const hydrateCoachMark = useCoachMarkStore((s) => s.hydrateFromServer);
  const { data: profile } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => AuthApi.getCurrentUser(),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
  useEffect(() => {
    const tours = (profile as { completedTours?: string[] })?.completedTours;
    if (tours?.length) hydrateCoachMark(tours);
  }, [profile, hydrateCoachMark]);
  return null;
}
import { trackPageView } from '@/lib/analytics';
import CONFIG from '@/lib/config';
import { routes } from '@/lib/routes';
import { FloatingAppBar } from '@/components/Layout';
import { TooltipProvider } from '@/components/ui/tooltip';
import BugReportButton from '@/components/BugReportButton';

const NetworkStatusBanner = dynamic(
  () => import('@/components/ui/NetworkStatusBanner'),
  { ssr: false }
);
import { trackActivity, ACTIVITY_EVENTS } from '@/lib/api/activityApi';

const MOBILE_BREAKPOINT = 768;

export default function App({ Component, pageProps }: AppProps<{ dehydratedState?: DehydratedState }>) {
  const router = useRouter();
  const pathname = router.pathname;
  const { dehydratedState, ...restPageProps } = pageProps;

  const [clientMounted, setClientMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    queueMicrotask(() => setClientMounted(true));
    return () => window.removeEventListener('resize', check);
  }, []);

  // Apply data-native-app attribute to enable native-mode CSS rules
  useEffect(() => {
    if (bridge.isNativeApp()) {
      document.documentElement.setAttribute('data-native-app', 'true');
    }
  }, []);

  // Post-mount initialization: accessibility
  const hydrateAccessibility = useAccessibilityStore((s) => s.hydrate);
  useEffect(() => {
    if (!clientMounted) return;
    hydrateAccessibility();
  }, [clientMounted, hydrateAccessibility]);

  // GA page view tracking — register event listener once, not on every route change
  useEffect(() => {
    if (!CONFIG.analytics.gaMeasurementId) return;
    const handleRouteChange = (url: string) => trackPageView(url);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router.events is stable
  }, []);

  // Server-side activity tracking — register once, track initial page view separately
  useEffect(() => {
    const handleRoute = (url: string) => trackActivity(ACTIVITY_EVENTS.PAGE_VIEW, { page: url });
    router.events.on('routeChangeComplete', handleRoute);
    return () => router.events.off('routeChangeComplete', handleRoute);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router.events is stable
  }, []);

  // Sync onlineManager with browser navigator.onLine
  useEffect(() => {
    const setOnline = () => onlineManager.setOnline(true);
    const setOffline = () => onlineManager.setOnline(false);
    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);
    return () => {
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    };
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: (failureCount, error) => {
              const axiosErr = error as { code?: string; response?: { status?: number }; status?: number };
              // handleApiError throws { status, message } (no response wrapper), so check both locations
              const httpStatus = axiosErr.response?.status ?? axiosErr.status;
              const isNetwork = !httpStatus || axiosErr.code === 'ERR_NETWORK';
              const isServerDown = [502, 503, 504].includes(httpStatus ?? 0);
              if (isNetwork || isServerDown) return failureCount < 5;
              return failureCount < 1;
            },
            retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 30000),
          },
        },
      }),
  );

  const hydrate = useAuthStore((s) => s.hydrate);
  const token = useAuthStore((s) => s.token);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const refreshToken = useAuthStore((s) => s.refreshToken);

  // Native app: send JWT + refreshToken for push token registration on login
  useEffect(() => {
    if (bridge.isNativeApp() && token) {
      bridge.sendAuth(token, refreshToken ?? undefined);
    }
  }, [token, refreshToken]);

  // Native app only: first screen by login state — logged in → home, not logged in → login page
  useEffect(() => {
    if (!clientMounted || !bridge.isNativeApp()) return;
    const isLoggedIn = !!token;
    if (!isLoggedIn && pathname === '/') {
      router.replace(routes.auth.login);
      return;
    }
    if (isLoggedIn && pathname === '/auth/login') {
      router.replace(routes.home);
    }
  }, [clientMounted, token, pathname, router]);

  // Native app: notify route changes + haptic feedback on navigation
  useEffect(() => {
    if (!bridge.isNativeApp()) return;
    const handleRouteChange = (url: string) => {
      bridge.send('ROUTE_CHANGED', { path: url });
      bridge.haptic('light');
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router.events is stable
  }, []);

  // Native app: listen for NAVIGATE messages from native (deep links, notifications)
  useEffect(() => {
    if (!bridge.isNativeApp()) return;
    return bridge.subscribe('NAVIGATE', (payload) => {
      const { path } = payload as { path?: string };
      if (path) router.push(path);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router is stable
  }, []);

  return (
    <>
      {CONFIG.analytics.gaMeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${CONFIG.analytics.gaMeasurementId}`}
            strategy='afterInteractive'
          />
          <Script id='ga-init' strategy='afterInteractive'>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${CONFIG.analytics.gaMeasurementId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      )}
      <Sentry.ErrorBoundary fallback={<p>An error occurred. Please refresh the page.</p>}>
        <QueryClientProvider client={queryClient}>
          <CoachMarkHydration />
          <HydrationBoundary state={dehydratedState ?? undefined}>
            <TooltipProvider>
              <Component {...restPageProps} />
            </TooltipProvider>
          </HydrationBoundary>
          {clientMounted && !pathname.startsWith('/auth') && pathname !== '/welcome' && (
            <FloatingAppBar pathname={pathname} asPath={router.asPath} isMobile={isMobile} />
          )}
          {clientMounted && !pathname.startsWith('/auth') && pathname !== '/welcome' && <BugReportButton />}
        </QueryClientProvider>
      </Sentry.ErrorBoundary>
      {clientMounted && <NetworkStatusBanner />}
    </>
  );
}
