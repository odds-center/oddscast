import Layout from '@/components/Layout';
import Icon from '@/components/icons';
import PageHeader from '@/components/page/PageHeader';
import AuthApi from '@/lib/api/authApi';
import NativeBridge from '@/lib/bridge';
import { useAuthStore } from '@/lib/store/authStore';
import { routes } from '@/lib/routes';
import {
  TodayRacesSection,
  WeekRacesSection,
  RecentResultsSection,
  PredictionMatrixPreviewSection,
  RacePredictionsPreviewSection,
  RankingPreviewSection,
  AllRacesSection,
} from '@/components/home';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isNative, setIsNative] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    setIsNative(NativeBridge.isNativeApp());
    const unsubSuccess = NativeBridge.subscribe(
      'LOGIN_SUCCESS',
      async (payload: { token: string }) => {
        const idToken = payload.token;
        if (!idToken) return;
        setLoginError(null);
        try {
          const res = await AuthApi.googleLogin(idToken);
          if (res?.accessToken) {
            setAuth(res.accessToken, res.user);
          }
        } catch (err: unknown) {
          setLoginError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
        }
      },
    );
    const unsubFailure = NativeBridge.subscribe('LOGIN_FAILURE', (payload: { error?: string }) => {
      setLoginError(payload?.error || '로그인에 실패했습니다.');
    });
    return () => {
      unsubSuccess();
      unsubFailure();
    };
  }, [setAuth]);

  const handleGoogleLogin = () => {
    if (isNative) {
      setLoginError(null);
      NativeBridge.send('LOGIN_GOOGLE');
    } else {
      window.location.href = routes.auth.login;
    }
  };

  return (
    <Layout title='GOLDEN RACE — AI 경마 예측'>
      <PageHeader
        icon='Flag'
        title='GOLDEN RACE'
        description='AI 기반 경마 예측 분석 서비스'
        children={
          !isLoggedIn && (
            <div className='flex flex-col items-start lg:items-end gap-2'>
              <button
                onClick={handleGoogleLogin}
                className='btn-primary flex items-center gap-2 px-5 py-2.5 text-sm shrink-0'
              >
                <Icon name='LogIn' size={18} />
                {isNative ? 'Google 로그인' : '로그인'}
              </button>
              {loginError && <p className='msg-error'>{loginError}</p>}
            </div>
          )
        }
      />

      {/* 섹션 미리보기 — 바로가기 버튼 대신 콘텐츠 프리뷰 */}
      <div className='grid lg:grid-cols-2 gap-6 mb-8'>
        <TodayRacesSection />
        <WeekRacesSection />
      </div>

      <div className='grid lg:grid-cols-2 gap-6 mb-8'>
        <RecentResultsSection />
        <PredictionMatrixPreviewSection />
      </div>

      <div className='grid lg:grid-cols-2 gap-6 mb-8'>
        <RacePredictionsPreviewSection />
        <RankingPreviewSection />
      </div>

      {/* 전체 경주 목록 */}
      <div className='mb-8'>
        <AllRacesSection />
      </div>
    </Layout>
  );
}
