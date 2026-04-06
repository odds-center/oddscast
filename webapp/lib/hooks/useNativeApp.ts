'use client';

import { useState, useCallback } from 'react';
import bridge from '@/lib/bridge';

/**
 * Comprehensive native app hook.
 * Returns isNative flag + convenience bridge methods with safe fallbacks.
 *
 * Use this for new code instead of useIsNativeApp when you also need bridge methods.
 * useIsNativeApp() is kept for backwards compatibility (returns boolean only).
 */
export interface UseNativeAppReturn {
  isNative: boolean;
  haptic: (pattern?: 'light' | 'medium' | 'heavy') => void;
  share: (title: string, url: string) => Promise<void>;
  toast: (message: string) => void;
  copyToClipboard: (text: string) => Promise<void>;
}

export function useNativeApp(): UseNativeAppReturn {
  const [isNative] = useState<boolean>(() =>
    typeof window !== 'undefined' ? Boolean(window.__IS_NATIVE_APP__) : false,
  );

  const haptic = useCallback(
    (pattern: 'light' | 'medium' | 'heavy' = 'light') => {
      if (isNative) bridge.haptic(pattern);
    },
    [isNative],
  );

  const share = useCallback(
    async (title: string, url: string) => {
      if (isNative) {
        await bridge.share(title, url).catch(() => {});
      } else if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, url }).catch(() => {});
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url).catch(() => {});
      }
    },
    [isNative],
  );

  const toast = useCallback(
    (message: string) => {
      if (isNative) bridge.toast(message);
    },
    [isNative],
  );

  const copyToClipboard = useCallback(
    async (text: string) => {
      if (isNative) {
        await bridge.copyToClipboard(text).catch(() => {});
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text).catch(() => {});
      }
    },
    [isNative],
  );

  return { isNative, haptic, share, toast, copyToClipboard };
}
