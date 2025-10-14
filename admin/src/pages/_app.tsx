import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 캐싱 최적화
            staleTime: 5 * 60 * 1000, // 5분 동안 fresh 상태 유지
            gcTime: 10 * 60 * 1000, // 10분 동안 캐시 유지

            // 자동 refetch 비활성화 (성능 향상)
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,

            // 재시도 최적화
            retry: 1, // 실패 시 1회만 재시도
            retryDelay: 1000, // 1초 대기

            // 네트워크 최적화
            networkMode: 'online', // 온라인일 때만 요청
          },
          mutations: {
            // Mutation 재시도 비활성화 (중복 요청 방지)
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position='top-right'
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
