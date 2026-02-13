import type { AppProps } from 'next/app';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'pretendard/dist/web/static/pretendard.css';
import '@/styles/globals.css';
import bridge from '@/lib/bridge';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { trackPageView } from '@/lib/analytics';
import CONFIG from '@/lib/config';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    if (!CONFIG.analytics.gaMeasurementId) return;
    const handleRouteChange = (url: string) => trackPageView(url);
    router.events.on('routeChangeComplete', handleRouteChange);
    trackPageView(router.asPath);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.asPath, router.events]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  const hydrate = useAuthStore((s) => s.hydrate);
  const token = useAuthStore((s) => s.token);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // 네이티브 앱: 로그인 시 푸시 토큰 등록을 위해 JWT 전달
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
        <Component {...pageProps} />
      </QueryClientProvider>
    </>
  );
}
