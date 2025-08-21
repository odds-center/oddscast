import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthProvider';

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // 이미 로그인된 사용자는 홈 화면으로
      router.replace('/(app)');
    } else {
      // 로그인되지 않은 사용자는 로그인 화면으로
      router.replace('/(auth)/login');
    }
  }, [user, router]);

  return null; // 리다이렉트 중에는 아무것도 렌더링하지 않음
}
