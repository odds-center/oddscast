import { ThemedText } from '@/components/ThemedText';
import { useGoogleLogin, useLogin } from '@/lib/hooks/useAuth';
import { showUserErrorMessage, showUserSuccessMessage } from '@/utils/alert';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleLogin();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      // Google 로그인 실행
      const result = await googleLoginMutation.mutateAsync();
      showUserSuccessMessage('Google 로그인이 완료되었습니다.');
    } catch (error) {
      showUserErrorMessage('Google 로그인이 완패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>GoldenRace</ThemedText>
      <ThemedText style={styles.subtitle}>경마 앱에 오신 것을 환영합니다</ThemedText>

      <TouchableOpacity
        style={[styles.googleButton, isLoading && styles.disabledButton]}
        onPress={handleGoogleLogin}
        disabled={isLoading}
      >
        <ThemedText style={styles.googleButtonText}>
          {isLoading ? '로그인 중...' : 'Google 계정으로 로그인'}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0C2A1E',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E5C99C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 48,
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 250,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
