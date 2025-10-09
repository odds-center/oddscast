import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';
import { View, ActivityIndicator } from 'react-native';
import { GOLD_THEME } from '@/constants/theme';

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // 이미 로그인된 사용자는 홈 화면으로
        console.log('User authenticated, redirecting to home');
        router.replace('/(app)');
      } else {
        // 로그인되지 않은 사용자는 로그인 화면으로
        console.log('User not authenticated, redirecting to login');
        router.replace('/(auth)/login');
      }
    }
  }, [user, isLoading, router]);

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

  return null; // 리다이렉트 중에는 아무것도 렌더링하지 않음
}
