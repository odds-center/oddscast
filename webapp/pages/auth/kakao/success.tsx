import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuthStore } from '@/lib/store/authStore';
import { routes } from '@/lib/routes';
import AuthApi from '@/lib/api/authApi';
import { getErrorMessage } from '@/lib/utils/error';

/**
 * Landing page after successful Kakao OAuth callback.
 * The server redirects here with ?token=...&refreshToken=...
 * We fetch the user profile and store credentials.
 */
export default function KakaoSuccess() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (!router.isReady) return;

    const { token, refreshToken } = router.query;

    if (!token || typeof token !== 'string') {
      void router.replace(routes.auth.login + '?error=kakao_failed');
      return;
    }

    AuthApi.getMe(token)
      .then((user) => {
        setAuth(
          token,
          user,
          typeof refreshToken === 'string' ? refreshToken : undefined,
        );
        void router.replace(routes.home);
      })
      .catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error('[KakaoSuccess] getMe failed:', getErrorMessage(err));
        void router.replace(routes.auth.login + '?error=kakao_failed');
      });
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Layout title='카카오 로그인 | OddsCast'>
      <div className='min-h-[60vh] flex flex-col items-center justify-center gap-4'>
        <LoadingSpinner label='카카오 로그인 처리 중...' />
      </div>
    </Layout>
  );
}
