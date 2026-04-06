'use client';

import { useState, useCallback } from 'react';
import { useNativeApp } from '@/lib/hooks/useNativeApp';
import { Share2 } from 'lucide-react';

export interface ShareButtonProps {
  /** Share dialog title */
  title: string;
  /** Share description text (used by Web Share API) */
  text: string;
  /** URL to share */
  url: string;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * ShareButton — triggers native share sheet (iOS/Android), Web Share API,
 * or clipboard copy fallback. Shows a brief "링크 복사됨!" toast when
 * the clipboard fallback is used.
 */
export default function ShareButton({
  title,
  text,
  url,
  className = '',
  size = 'md',
}: ShareButtonProps) {
  const { isNative, share, copyToClipboard } = useNativeApp();
  const [copied, setCopied] = useState(false);

  const sizeClass =
    size === 'sm'
      ? 'text-xs px-2.5 py-1.5 gap-1.5'
      : 'text-sm px-3 py-2 gap-2';

  const iconSize = size === 'sm' ? 13 : 15;

  const handleShare = useCallback(async () => {
    if (isNative) {
      // Use native share sheet
      await share(title, url);
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      // Web Share API (mobile browsers, modern desktop)
      await navigator.share({ title, text, url }).catch(() => {});
      return;
    }

    // Clipboard fallback
    await copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [isNative, share, copyToClipboard, title, text, url]);

  return (
    <button
      type='button'
      onClick={handleShare}
      className={`btn-secondary inline-flex items-center ${sizeClass} ${className}`}
      aria-label='공유하기'
    >
      <Share2 size={iconSize} />
      <span>{copied ? '링크 복사됨!' : '공유'}</span>
    </button>
  );
}
