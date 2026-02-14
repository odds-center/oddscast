'use client';

import { useState, useEffect } from 'react';

/**
 * Mobile WebView 내에서 로드되었는지 여부
 * 푸시 알림 토글은 native 앱에서만 노출
 *
 * Mobile WebView가 injectedJavaScriptBeforeContentLoaded로 window.__IS_NATIVE_APP__=true 주입
 */
declare global {
  interface Window {
    __IS_NATIVE_APP__?: boolean;
  }
}

export function useIsNativeApp(): boolean {
  const [isNative, setIsNative] = useState(() =>
    typeof window !== 'undefined' ? Boolean(window.__IS_NATIVE_APP__) : false,
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      queueMicrotask(() => setIsNative(Boolean(window.__IS_NATIVE_APP__)));
    }
  }, []);

  return isNative;
}
