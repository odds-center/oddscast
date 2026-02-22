'use client';

import { useState, useEffect } from 'react';

/**
 * Whether loaded inside Mobile WebView
 * Push notification toggle is only shown in native app
 *
 * Mobile WebView injects window.__IS_NATIVE_APP__=true via injectedJavaScriptBeforeContentLoaded
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
