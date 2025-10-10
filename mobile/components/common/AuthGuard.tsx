import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { View, ActivityIndicator } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

/**
 * 인증 가드 컴포넌트
 * - 토큰이 없거나 유효하지 않으면 로그인 페이지로 리다이렉트
 * - 보호된 라우트에 대한 접근 제어
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    console.log('🔒 AuthGuard check:', {
      hasUser: !!user,
      isLoading,
      segments,
      inAuthGroup,
      inAppGroup,
    });

    if (!user && !inAuthGroup) {
      // 로그인하지 않았고, 인증 그룹이 아닌 경우 로그인 페이지로
      console.log('🚫 Unauthorized access, redirecting to login');
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // 이미 로그인했는데 인증 페이지에 있는 경우 홈으로
      console.log('✅ Already authenticated, redirecting to home');
      router.replace('/(app)/home');
    }
  }, [user, isLoading, segments, router]);

  // 로딩 중에는 로딩 인디케이터 표시
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY,
        }}
      >
        <ActivityIndicator size='large' color={GOLD_THEME.GOLD.LIGHT} />
      </View>
    );
  }

  return <>{children}</>;
}
