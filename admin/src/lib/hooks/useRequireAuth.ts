import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './useAuth';

const LOGIN_PATH = '/login';

/**
 * Protects admin pages: redirects to /login when there is no token.
 * Use in Layout so all Layout-wrapped pages require admin auth.
 */
export function useRequireAuth(): { isAuthenticated: boolean; isChecking: boolean } {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsChecking(false);
      return;
    }

    const fromStorage =
      (() => {
        try {
          const raw = localStorage.getItem('auth-storage');
          if (raw) {
            const parsed = JSON.parse(raw) as { state?: { accessToken?: string } };
            return parsed?.state?.accessToken ?? null;
          }
        } catch {
          // ignore
        }
        return null;
      })() ??
      localStorage.getItem('accessToken') ??
      localStorage.getItem('admin_token');

    const token = accessToken ?? fromStorage;

    if (!token) {
      const current = router.pathname;
      if (current !== LOGIN_PATH) {
        const redirect = current && current !== '/' ? `?redirect=${encodeURIComponent(current)}` : '';
        window.location.href = `${LOGIN_PATH}${redirect}`;
      }
      setHasToken(false);
      setIsChecking(false);
      return;
    }

    setHasToken(true);
    setIsChecking(false);
  }, [accessToken, router.pathname]);

  return { isAuthenticated: hasToken || !!accessToken, isChecking };
}
