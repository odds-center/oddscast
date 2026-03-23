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

    // Verify admin role from stored user data
    if (token) {
      try {
        const authRaw = localStorage.getItem('auth-storage');
        if (authRaw) {
          const parsed = JSON.parse(authRaw) as { state?: { user?: { role?: string } } };
          const role = parsed?.state?.user?.role;
          if (role && role !== 'ADMIN') {
            // Non-admin user — reject access
            localStorage.removeItem('auth-storage');
            localStorage.removeItem('accessToken');
            window.location.href = LOGIN_PATH;
            setHasToken(false);
            setIsChecking(false);
            return;
          }
        }
      } catch {
        // Ignore parse errors — proceed with token check
      }
    }

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
