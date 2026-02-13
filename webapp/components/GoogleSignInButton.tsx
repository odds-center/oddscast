'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import CONFIG from '@/lib/config';
import nativeBridge from '@/lib/bridge';
import { trackCTA } from '@/lib/analytics';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              type?: 'standard' | 'icon';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
              locale?: string;
            },
          ) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onSuccess?: (idToken: string) => void | Promise<void>;
  onError?: (error: string) => void;
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  theme = 'outline',
  size = 'large',
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  // Mobile WebView: Native 구글 로그인 사용 (GSI는 WebView에서 제한 있음)
  useEffect(() => {
    if (!nativeBridge.isNativeApp()) return;
    const unsubSuccess = nativeBridge.subscribe('LOGIN_SUCCESS', (payload: unknown) => {
      const p = payload as { token?: string };
      if (p?.token) onSuccessRef.current?.(p.token);
    });
    const unsubFail = nativeBridge.subscribe('LOGIN_FAILURE', (payload: unknown) => {
      const p = payload as { error?: string };
      onErrorRef.current?.(p?.error ?? '로그인에 실패했습니다.');
    });
    return () => {
      unsubSuccess();
      unsubFail();
    };
  }, []);

  const handleNativeGoogleLogin = () => {
    trackCTA('GOOGLE_LOGIN_CLICK', 'native');
    nativeBridge.send('LOGIN_GOOGLE');
  };

  // WebView(Native 앱) 내부일 때: Native Google Sign-In 버튼
  if (nativeBridge.isNativeApp()) {
    return (
      <button
        type='button'
        onClick={handleNativeGoogleLogin}
        className='w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-border bg-card hover:bg-secondary transition-colors'
        style={{ minHeight: 44 }}
      >
        <svg width='18' height='18' viewBox='0 0 18 18'>
          <path
            fill='#4285F4'
            d='M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z'
          />
          <path
            fill='#34A853'
            d='M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.4-2.54h-2.7v2.07A8 8 0 008.98 17z'
          />
          <path
            fill='#FBBC05'
            d='M4.58 10.53a4.8 4.8 0 010-3.06V5.4H1.89A8 8 0 00.98 9c0 1.45.35 2.82.9 4.04z'
          />
          <path
            fill='#EA4335'
            d='M8.98 3.58c1.32 0 2.5.45 3.44 1.34l2.54-2.54A7.9 7.9 0 008.98.98a8 8 0 00-7.09 4.4l2.67 2.07a4.8 4.8 0 014.42-2.87z'
          />
        </svg>
        <span>Google로 로그인</span>
      </button>
    );
  }

  // 웹: Google GSI 버튼
  useEffect(() => {
    const clientId = CONFIG.google.clientId;
    if (!clientId || !scriptLoaded || !window.google?.accounts?.id || !containerRef.current) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          trackCTA('GOOGLE_LOGIN_CLICK', 'web_success');
          onSuccess?.(response.credential);
        } else {
          onError?.('로그인에 실패했습니다.');
        }
      },
    });

    if (containerRef.current) {
      window.google.accounts.id.renderButton(containerRef.current, {
        theme,
        size,
        type: 'standard',
        text: 'signin_with',
        shape: 'rectangular',
      });
    }
  }, [scriptLoaded, onSuccess, onError, theme, size]);

  if (!CONFIG.google.clientId) {
    return (
      <p className='text-text-secondary text-sm'>
        Google 로그인을 사용하려면 NEXT_PUBLIC_GOOGLE_CLIENT_ID를 설정하세요.
      </p>
    );
  }

  return (
    <>
      <Script
        src='https://accounts.google.com/gsi/client'
        strategy='afterInteractive'
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={containerRef} className='min-h-[40px] flex justify-center' />
    </>
  );
}
