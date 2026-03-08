'use client';

import { useState } from 'react';

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
  const [isNative] = useState(() =>
    typeof window !== 'undefined' ? Boolean(window.__IS_NATIVE_APP__) : false,
  );

  return isNative;
}
