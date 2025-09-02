import { Link, Stack, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { PageLayout } from '@/components/common/PageLayout';
import { useAuth } from '@/context/AuthProvider';
import React, { useEffect } from 'react';
import { Title } from '@/components/ui';

export default function NotFoundScreen() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // 이미 로그인된 상태라면 홈으로 리다이렉션
    if (user) {
      router.replace('/home');
    }
  }, [user, router]);

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <PageLayout>
        <Title>존재하지 않는 화면입니다.</Title>
        <Link href={user ? '/home' : '/login'} style={styles.link}>
          <ThemedText type='link'>{user ? '홈으로 이동' : '로그인 화면으로 이동'}</ThemedText>
        </Link>
      </PageLayout>
    </>
  );
}

const styles = StyleSheet.create({
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
