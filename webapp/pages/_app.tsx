import type { AppProps } from 'next/app';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { QueryClient, QueryClientProvider, HydrationBoundary, onlineManager } from '@tanstack/react-query';
import type { DehydratedState } from '@tanstack/react-query';
import 'pretendard/dist/web/static/pretendard.css';
import '@/styles/globals.css';
import bridge from '@/lib/bridge';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { trackPageView } from '@/lib/analytics';
import CONFIG from '@/lib/config';
import { FloatingAppBar } from '@/components/Layout';
import NetworkStatusBanner from '@/components/ui/NetworkStatusBanner';
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

  useEffect(() => {
    if (!CONFIG.analytics.gaMeasurementId) return;
    const handleRouteChange = (url: string) => trackPageView(url);
    router.events.on('routeChangeComplete', handleRouteChange);
    trackPageView(router.asPath);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.asPath, router.events]);

  // Server-side activity tracking (page views)
  useEffect(() => {
    trackActivity(ACTIVITY_EVENTS.PAGE_VIEW, { page: router.asPath });
    const handleRoute = (url: string) => trackActivity(ACTIVITY_EVENTS.PAGE_VIEW, { page: url });
    router.events.on('routeChangeComplete', handleRoute);
    return () => router.events.off('routeChangeComplete', handleRoute);
  }, [router.asPath, router.events]);

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
              const axiosErr = error as { code?: string; response?: { status?: number } };
              const isNetwork = !axiosErr.response || axiosErr.code === 'ERR_NETWORK';
              const isServerDown = [502, 503, 504].includes(axiosErr.response?.status ?? 0);
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

  // Native app: send JWT for push token registration on login
  useEffect(() => {
    if (bridge.isNativeApp() && token) {
      bridge.send('AUTH_READY', { token });
    }
  }, [token]);

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
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState ?? undefined}>
          <Component {...restPageProps} />
        </HydrationBoundary>
      </QueryClientProvider>
      {clientMounted && <NetworkStatusBanner />}
      {clientMounted && <FloatingAppBar pathname={pathname} isMobile={isMobile} />}
    </>
  );
}
